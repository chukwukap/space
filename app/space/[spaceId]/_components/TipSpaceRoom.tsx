"use client";

import { useTipReaction } from "@/app/hooks/useTipReaction";
import { useUser } from "@/app/providers/userProvider";
import { ConnectionDetails, ParticipantMetadata } from "@/lib/types";
import {
  useLocalParticipant,
  useRoomContext,
  useTracks,
  ConnectionStateToast,
  LocalUserChoices,
  RoomContext,
  TrackLoop,
  WidgetState,
  Chat,
  LayoutContextProvider,
  RoomAudioRenderer,
} from "@livekit/components-react";
import {
  AudioCaptureOptions,
  AudioPresets,
  Room,
  RoomConnectOptions,
  RoomEvent,
  RoomOptions,
  Track,
  Participant,
} from "livekit-client";
import { useRouter } from "next/navigation";
import React, { useState, useCallback, useEffect } from "react";
import { useChainId } from "wagmi";
import ReactionPicker from "./ReactionPicker";
import ReactionOverlay from "./ReactionOverlay";
import TipModal from "./TipModal";

import BottomBar from "./bottomBar";
import { TipRecipient } from "@/lib/types";
import { toast } from "sonner";
import { approveSpendPermission } from "@/actions/spendPermission";
import "@livekit/components-styles";
import { useLowCPUOptimizer } from "@/app/hooks/usePerfomanceOptimiser";
import { KeyboardShortcuts } from "@/lib/KeyboardShortcuts";
import { RecordingIndicator } from "@/lib/RecordingIndicator";
import { DebugMode } from "@/lib/Debug";
import { CustomParticipantTile } from "./participantTiile";

export default function TipSpaceRoom(props: {
  userChoices: LocalUserChoices;
  connectionDetails: ConnectionDetails;
  options: {
    hq: boolean;
  };
}) {
  // LiveKit RoomOptions for a Twitter Space-like experience:
  // - High quality stereo audio for music/voice
  // - No video, adaptive stream for bandwidth, dynacast for efficiency
  // - No E2EE for simplicity (can be added later if needed)
  // - No video simulcast layers (audio only)
  // - Use echo cancellation, noise suppression, and auto gain for clarity

  const roomOptions = React.useMemo((): RoomOptions => {
    const audioCaptureDefaults: AudioCaptureOptions = {
      deviceId: props.userChoices.audioDeviceId ?? undefined,
      ...AudioPresets.musicHighQualityStereo, // stereo, 48kHz, 128kbps
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    };

    return {
      audioCaptureDefaults,
      adaptiveStream: true, // optimize bandwidth for listeners
      dynacast: true, // only send audio to those who need it
      // No videoCaptureDefaults or publishDefaults needed for audio-only
    };
  }, [props.userChoices.audioDeviceId]);

  const room = React.useMemo(() => new Room(roomOptions), []);

  const connectOptions = React.useMemo((): RoomConnectOptions => {
    return {
      autoSubscribe: true,
    };
  }, []);

  React.useEffect(() => {
    room.on(RoomEvent.Disconnected, handleOnLeave);
    room.on(RoomEvent.MediaDevicesError, handleError);

    room
      .connect(
        props.connectionDetails.serverUrl,
        props.connectionDetails.participantToken,
        connectOptions,
      )
      .catch((error) => {
        handleError(error);
      });

    room.localParticipant.setCameraEnabled(true).catch((error) => {
      handleError(error);
    });

    room.localParticipant.setMicrophoneEnabled(true).catch((error) => {
      handleError(error);
    });

    return () => {
      room.off(RoomEvent.Disconnected, handleOnLeave);
      room.off(RoomEvent.MediaDevicesError, handleError);
    };
  }, [room, props.connectionDetails, props.userChoices]);

  const lowPowerMode = useLowCPUOptimizer(room);

  const router = useRouter();
  const handleOnLeave = React.useCallback(() => router.push("/"), [router]);
  const handleError = React.useCallback((error: Error) => {
    console.error(error);
  }, []);

  React.useEffect(() => {
    if (lowPowerMode) {
      console.warn("Low power mode enabled");
    }
  }, [lowPowerMode]);

  return (
    <div className="lk-room-container">
      <RoomContext.Provider value={room}>
        <ConnectionStateToast room={room} />
        <KeyboardShortcuts />
        <TipSpaceRoomLayout />
        {/* <AudioConference /> */}
        <DebugMode />
        <RecordingIndicator />
        <RoomAudioRenderer />
      </RoomContext.Provider>
    </div>
  );
}

export function TipSpaceRoomLayout() {
  const room = useRoomContext();

  const [widgetState, setWidgetState] = React.useState<WidgetState>({
    showChat: false,
    unreadMessages: 0,
  });
  const { user } = useUser();
  const { localParticipant } = useLocalParticipant();
  const audioTracks = useTracks([Track.Source.Microphone]);
  const chainId = useChainId();
  const [reactions, setReactions] = useState<
    Array<{ id: number; left: number; emoji: string }>
  >([]);

  // Listeners list (participants without microphone enabled)
  const [listeners, setListeners] = useState<Participant[]>([]);

  // Reaction picker open state
  const [pickerOpen, setPickerOpen] = useState(false);

  const [tipModalOpen, setTipModalOpen] = useState(false);

  // Helper – send data messages to room
  const sendData = useCallback(
    (message: Record<string, unknown>) => {
      try {
        localParticipant?.publishData(
          new TextEncoder().encode(JSON.stringify(message)),
          { reliable: true },
        );
      } catch (err) {
        console.error("[LiveKit] Failed to publish data", err);
      }
    },
    [localParticipant],
  );

  /**
   * Toggle local participant hand raise and broadcast.
   */
  const handleRaiseHand = useCallback(() => {
    if (!localParticipant) return;

    try {
      const currentMeta = localParticipant.metadata
        ? JSON.parse(localParticipant.metadata)
        : {};

      const raised = !currentMeta.handRaised;
      const newMeta = { ...currentMeta, handRaised: raised };
      localParticipant.setMetadata(JSON.stringify(newMeta));

      // Broadcast data message for hosts
      sendData({
        type: raised ? "handRaise" : "handLower",
        sid: localParticipant.sid,
      });
    } catch (error) {
      console.error("[HandRaise] toggle error", error);
    }
  }, [localParticipant, sendData]);

  // Add floating reaction helper
  const addFloatingReaction = (emoji: string) => {
    const id = Date.now();
    setReactions((prev) => [
      ...prev,
      { id, left: Math.random() * 80 + 10, emoji },
    ]);
    setTimeout(
      () => setReactions((prev) => prev.filter((r) => r.id !== id)),
      3000,
    );
  };

  // Listen for incoming hand raise & invite messages
  useHandRaiseListener(room, addFloatingReaction);

  // Update listeners whenever room roster changes
  useEffect(() => {
    if (!room) return;
    const recompute = () => {
      const all = [
        ...Array.from(room.remoteParticipants.values()),
        room.localParticipant,
      ].filter(Boolean) as Participant[];
      setListeners(all.filter((p) => !p.isMicrophoneEnabled));
    };
    recompute();
    room.on(RoomEvent.ParticipantConnected, recompute);
    room.on(RoomEvent.ParticipantDisconnected, recompute);
    return () => {
      room.off(RoomEvent.ParticipantConnected, recompute);
      room.off(RoomEvent.ParticipantDisconnected, recompute);
    };
  }, [room]);

  // Recipients: host + speakers
  // Build host recipient and speaker recipients, then filter out any without a wallet address
  // const hostRecipient = {
  //   id: roomMetadata.host.fid,
  //   name: roomMetadata.host.displayName || roomMetadata.host.username || "Host",
  //   walletAddress: roomMetadata.host.address,
  // };

  const speakerRecipients: TipRecipient[] = room.activeSpeakers.map((s) => {
    const speakerMetadata: ParticipantMetadata = s.metadata
      ? JSON.parse(s.metadata)
      : null;

    const name = speakerMetadata?.displayName || `Speaker ${s.name}`;
    const walletAddress = speakerMetadata?.address;

    return {
      fid: speakerMetadata?.fid ?? null,
      name,
      walletAddress,
    };
  });

  // Only include recipients with a non-null, non-undefined walletAddress and fid
  const recipients: TipRecipient[] = [
    // roomMetadata.host,
    ...speakerRecipients,
  ].filter((r): r is TipRecipient => !!r.fid);

  const { handleSendReaction, reactionLoading } = useTipReaction({
    user: user,
    // hostId: roomMetadata.host.fid.toString(),
    hostId: "1",
    spaceId: room.name,
    chainId,
    approveSpendPermission,
    sendData,
    addFloatingReaction,
  });

  return (
    <LayoutContextProvider onWidgetChange={setWidgetState}>
      <div className="flex flex-col h-screen">
        {/* Room Title */}
        <h1
          className="px-6 text-lg font-bold leading-snug mt-4"
          data-testid="space-title"
        >
          {/* {roomMetadata.title || "Untitled Space"} */}
          Test Title
        </h1>
        <div className="flex flex-col justify-center items-center gap bg-background">
          <TrackLoop tracks={audioTracks}>
            <CustomParticipantTile />
          </TrackLoop>

          {/* Listeners grid */}
          {listeners.length > 0 && (
            <div
              className="flex flex-wrap justify-center gap-4 mt-4 px-4"
              data-testid="listeners-grid"
            >
              {listeners.map((lp) => (
                <CustomParticipantTile key={lp.sid} participant={lp} />
              ))}
            </div>
          )}
        </div>
        <BottomBar
          onOpenReactionPicker={() => setPickerOpen(true)}
          onTipClick={() => setTipModalOpen(true)}
          onInviteClick={() => {
            console.log("invite");
          }}
          onRaiseHand={handleRaiseHand}
        />
        {widgetState.showChat && <Chat />}
        {/* Floating reactions overlay */}
        <ReactionOverlay reactions={reactions} />
        <TipModal
          open={tipModalOpen}
          onClose={() => setTipModalOpen(false)}
          recipients={recipients}
          defaultRecipientId={1}
          userId={user?.id ?? 0}
          spaceId={room.name}
          onTipSuccess={() => {
            setTipModalOpen(false);
            if (toast) toast.success("Tip sent!");
          }}
        />
        {pickerOpen && (
          <ReactionPicker
            onPick={(t) => handleSendReaction(t)}
            onClose={() => {
              setPickerOpen(false);
            }}
            loading={reactionLoading}
          />
        )}
      </div>
    </LayoutContextProvider>
  );
}

// Listen for data messages to surface hand raise notifications for hosts.
// We keep this logic outside the component body to prevent hook rule violations.

export function useHandRaiseListener(
  room: Room,
  addFloatingReaction: (emoji: string) => void,
) {
  useEffect(() => {
    const handleData = (payload: Uint8Array) => {
      try {
        const msg = JSON.parse(new TextDecoder().decode(payload));
        switch (msg.type) {
          case "handRaise":
            addFloatingReaction("✋");
            break;
          case "inviteSpeak":
            // If this message targets us, enable mic
            if (
              room.localParticipant &&
              msg.sid === room.localParticipant.sid
            ) {
              room.localParticipant
                .setMicrophoneEnabled(true)
                .catch(console.error);
              // Clear handRaised flag
              try {
                const meta = room.localParticipant.metadata
                  ? JSON.parse(room.localParticipant.metadata)
                  : {};
                delete meta.handRaised;
                room.localParticipant.setMetadata(JSON.stringify(meta));
              } catch {}
            }
            break;
          case "handLower":
            break;
          default:
            break;
        }
      } catch (err) {
        console.error("[LiveKit] Failed to handle data", err);
      }
    };

    room.on(RoomEvent.DataReceived, handleData);
    return () => {
      room.off(RoomEvent.DataReceived, handleData);
    };
  }, [room, addFloatingReaction]);
}

// useEffect(() => {
//   const handleData = (payload: Uint8Array) => {
//     try {
//       const msg = JSON.parse(new TextDecoder().decode(payload));
//       switch (msg.type) {
//         case "inviteSpeak":
//           // Listener granted permission to speak -> unmute if the message is for us
//           if (room.localParticipant && msg.sid === room.localParticipant.sid) {
//             room.localParticipant.setMicrophoneEnabled(true);
//           }
//           break;
//         case "reaction":
//           if (msg.reactionType) {
//             const emoji = REACTION_EMOJIS[msg.reactionType as ReactionType];
//             if (emoji) addFloatingReaction(emoji);
//           }
//           break;
//         case "muteRequest":
//           if (room.localParticipant && msg.sid === room.localParticipant.sid) {
//             room.localParticipant.setMicrophoneEnabled(false);
//           }
//           break;
//         case "demoteSpeaker":
//           if (room.localParticipant && msg.sid === room.localParticipant.sid) {
//             room.localParticipant.setMicrophoneEnabled(false);
//             // Clear handRaised and other speaker metadata to move back to listener view
//             try {
//               const meta = room.localParticipant.metadata
//                 ? JSON.parse(room.localParticipant.metadata)
//                 : {};
//               delete meta.handRaised;
//               room.localParticipant.setMetadata(JSON.stringify(meta));
//             } catch {}
//           }
//           break;
//         default:
//           break;
//       }
//     } catch (err) {
//       console.error("[LiveKit] Failed to handle data", err);
//     }
//   };

//   room.on(RoomEvent.DataReceived, handleData);
//   return () => {
//     room.off(RoomEvent.DataReceived, handleData);
//   };
// }, [room]);
