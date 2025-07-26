"use client";

import { useBasedReaction } from "@/app/hooks/useBasedReaction";
import { useUser } from "@/app/providers/userProvider";
import { ConnectionDetails, ParticipantMetadata } from "@/lib/types";
import {
  useLocalParticipant,
  useRoomContext,
  ConnectionStateToast,
  LocalUserChoices,
  RoomContext,
  WidgetState,
  Chat,
  LayoutContextProvider,
  RoomAudioRenderer,
  DisconnectButton,
} from "@livekit/components-react";
import {
  AudioCaptureOptions,
  AudioPresets,
  Room,
  RoomConnectOptions,
  RoomEvent,
  RoomOptions,
  Participant,
} from "livekit-client";
import { useRouter } from "next/navigation";
import React, { useState, useCallback, useEffect, useMemo } from "react";

import ReactionPicker from "./ReactionPicker";
import ReactionOverlay from "./ReactionOverlay";
import TipModal from "./TipModal";

import BottomBar from "./bottomBar";
import { TipRecipient } from "@/lib/types";
import { toast } from "sonner";

import { useLowCPUOptimizer } from "@/app/hooks/usePerfomanceOptimiser";
import { KeyboardShortcuts } from "@/lib/KeyboardShortcuts";
import { RecordingIndicator } from "@/lib/RecordingIndicator";
import { CustomParticipantTile } from "./participantTiile";

import MobileHeader from "@/app/_components/mobileHeader";
import { USDC_ADDRESS_BASE } from "@/lib/constants";

export default function TipSpaceRoom(props: {
  userChoices: LocalUserChoices;
  connectionDetails: ConnectionDetails;
  title?: string;
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
    };

    return {
      audioCaptureDefaults,
      adaptiveStream: true,
      dynacast: true,
    };
  }, [props.userChoices.audioDeviceId]);

  const room = React.useMemo(() => new Room(roomOptions), [roomOptions]);

  const connectOptions = React.useMemo((): RoomConnectOptions => {
    return {
      autoSubscribe: true,
    };
  }, []);

  const router = useRouter();
  const handleOnLeave = React.useCallback(() => router.push("/"), [router]);
  const handleError = React.useCallback((error: Error) => {
    console.error(error);
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

    const perms = room.localParticipant.permissions;
    if (perms?.canPublish) {
      // For hosts/speakers default mic on
      room.localParticipant.setMicrophoneEnabled(true).catch(handleError);
    } else {
      // Ensure tracks remain disabled for listeners
      room.localParticipant.setCameraEnabled(false).catch(handleError);
      room.localParticipant.setMicrophoneEnabled(false).catch(handleError);
    }

    return () => {
      room.off(RoomEvent.Disconnected, handleOnLeave);
      room.off(RoomEvent.MediaDevicesError, handleError);
    };
  }, [
    room,
    props.connectionDetails,
    props.userChoices,
    connectOptions,
    handleOnLeave,
    handleError,
  ]);

  const lowPowerMode = useLowCPUOptimizer(room);

  React.useEffect(() => {
    if (lowPowerMode) {
      toast.warning("Low power mode enabled");
      console.warn("Low power mode enabled");
    }
  }, [lowPowerMode]);

  return (
    <div className="border border-red-500 h-full w-full flex flex-col max-w-screen-sm mx-auto">
      <RoomContext.Provider value={room}>
        <ConnectionStateToast
          room={room}
          className="absolute top-0 left-0 z-50"
        />
        <KeyboardShortcuts />
        <TipSpaceRoomLayout title={props.title} />
        <RecordingIndicator />
        <RoomAudioRenderer />
      </RoomContext.Provider>
    </div>
  );
}

export function TipSpaceRoomLayout(props: { title?: string }) {
  const room = useRoomContext();

  const [widgetState, setWidgetState] = React.useState<WidgetState>({
    showChat: false,
    unreadMessages: 0,
  });
  const { user } = useUser();
  const { localParticipant } = useLocalParticipant();

  const [reactions, setReactions] = useState<
    Array<{ id: number; left: number; emoji: string }>
  >([]);

  // Listeners list (participants without microphone enabled)
  const [listeners, setListeners] = useState<Participant[]>([]);

  // Reaction picker open state
  const [pickerOpen, setPickerOpen] = useState(false);

  const [tipModalOpen, setTipModalOpen] = useState(false);

  // Compute list of speaker participants (publish-capable)
  const speakers = useMemo(() => {
    const all = [
      ...Array.from(room.remoteParticipants.values()),
      room.localParticipant,
    ].filter(Boolean) as Participant[];
    return all.filter((p) => p.permissions?.canPublish);
  }, [room]);

  // Helper – send data messages to room
  const sendData = useCallback(
    (message: Record<string, unknown>) => {
      try {
        localParticipant?.publishData(
          new TextEncoder().encode(JSON.stringify(message)),
          // { reliable: true },
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
  const handleRaiseHandToggle = useCallback(() => {
    if (!localParticipant) return;

    try {
      const currentMeta = localParticipant.metadata
        ? JSON.parse(localParticipant.metadata)
        : {};

      const raised = !currentMeta?.handRaised;
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
  const addFloatingReaction = useCallback(
    (emoji: string) => {
      const id = Date.now();
      setReactions((prev) => [
        ...prev,
        { id, left: Math.random() * 80 + 10, emoji },
      ]);
      setTimeout(
        () => setReactions((prev) => prev.filter((r) => r.id !== id)),
        3000,
      );
    },
    [setReactions],
  );

  // Listen for incoming hand raise, hand lower, & invite messages
  useEffect(() => {
    const handleData = (payload: Uint8Array) => {
      try {
        const msg = JSON.parse(new TextDecoder().decode(payload));
        switch (msg.type) {
          case "handRaise":
            // addFloatingReaction("✋");
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
            if (
              room.localParticipant &&
              msg.sid === room.localParticipant.sid
            ) {
              try {
                const meta = room.localParticipant.metadata
                  ? JSON.parse(room.localParticipant.metadata)
                  : {};
                delete meta.handRaised;
                room.localParticipant.setMetadata(JSON.stringify(meta));
              } catch {}
            }
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

  // Update listeners whenever room roster changes
  useEffect(() => {
    if (!room) return;
    const recompute = () => {
      const all = [
        ...Array.from(room.remoteParticipants.values()),
        room.localParticipant,
      ].filter(Boolean);
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

  const speakerRecipients: TipRecipient[] = room.activeSpeakers.map((s) => {
    const speakerMetadata: ParticipantMetadata = s.metadata
      ? JSON.parse(s.metadata)
      : null;

    const name = speakerMetadata?.displayName || `Speaker ${s.name}`;
    const walletAddress = speakerMetadata?.address;

    return {
      id: speakerMetadata?.fid ?? null,
      fid: speakerMetadata?.fid ?? null,
      name,
      walletAddress,
    };
  });

  // Only include recipients with a non-null, non-undefined walletAddress and fid
  const recipients: TipRecipient[] = [...speakerRecipients].filter(
    (r): r is TipRecipient => !!r.fid && !!r.walletAddress,
  );

  const { handleSendReaction, reactionLoading } = useBasedReaction({
    user: user,
    hostId: user?.fid?.toString() ?? "",
    spaceId: room.name,
    localParticipant,
    addFloatingReaction,
  });

  return (
    <LayoutContextProvider onWidgetChange={setWidgetState}>
      <div className="flex flex-col">
        <MobileHeader
          showBack={true}
          lowerComponent={
            <DisconnectButton className="text-sm text-destructive font-medium ">
              {"Leave"}
            </DisconnectButton>
          }
        />
        {/* Room Title */}
        <h1
          className="px-6 text-lg font-bold leading-snug mt-4"
          data-testid="space-title"
        >
          {props.title || "Untitled Space"}
        </h1>
        <div className="flex flex-col gap-6 bg-background">
          {/* Host & Speakers horizontal list */}
          <div
            className="w-full overflow-x-auto px-4 flex gap-4 items-center"
            data-testid="speakers-row"
          >
            {speakers.map((sp) => (
              <CustomParticipantTile key={sp.sid} participant={sp} />
            ))}
          </div>
          {/* Listeners grid */}
          {listeners.length > 0 && (
            <div
              className="grid grid-cols-4 sm:grid-cols-6 gap-4 px-4"
              data-testid="listeners-grid"
            >
              {listeners.map((lp) => (
                <CustomParticipantTile key={lp.sid} participant={lp} />
              ))}
            </div>
          )}
        </div>
        <BottomBar
          roomName={room.name}
          onOpenReactionPicker={() => setPickerOpen(true)}
          onBasedTipClick={() => setTipModalOpen(true)}
          onInviteClick={() => {
            console.log("invite");
          }}
          onRaiseHandToggle={handleRaiseHandToggle}
        />
        {widgetState.showChat && <Chat />}
        {/* Floating reactions overlay */}
        <ReactionOverlay reactions={reactions} />
        <TipModal
          open={tipModalOpen}
          onClose={() => setTipModalOpen(false)}
          recipients={recipients}
          defaultRecipientId={1}
          onTipSuccess={() => {
            setTipModalOpen(false);
            if (toast) toast.success("Tip sent!");
          }}
          userFid={user?.fid ?? 0}
          spaceId={room.name}
          tokenAddress={USDC_ADDRESS_BASE}
          tipperWalletAddress={user?.address ?? ""}
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
