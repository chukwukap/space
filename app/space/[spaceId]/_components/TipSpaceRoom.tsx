"use client";

import { useLeaveRoom } from "@/app/hooks/useLeaveRoom";
import { useTipReaction } from "@/app/hooks/useTipReaction";
import { useUser } from "@/app/providers/userProvider";
import { ReactionType, Role } from "@/lib/generated/prisma";
import {
  ConnectionDetails,
  ParticipantMetadata,
  SpaceMetadata,
  SpaceWithHostParticipant,
} from "@/lib/types";
import {
  GridLayout,
  ParticipantAudioTile,
  useLocalParticipant,
  useRemoteParticipants,
  useRoomContext,
  useTracks,
  ControlBar,
  ConnectionStateToast,
  LocalUserChoices,
  VideoConference,
  RoomContext,
  formatChatMessageLinks,
  AudioConference,
  TrackLoop,
  WidgetState,
  Chat,
  LayoutContextProvider,
} from "@livekit/components-react";
import {
  AudioCaptureOptions,
  AudioPresets,
  Participant,
  Room,
  RoomConnectOptions,
  RoomEvent,
  RoomOptions,
  Track,
} from "livekit-client";
import { useRouter } from "next/navigation";
import React, { useState, useCallback, useEffect } from "react";
import { useChainId } from "wagmi";
import ReactionPicker from "./ReactionPicker";
import ReactionOverlay from "./ReactionOverlay";
import TipModal from "./TipModal";
import { ParticipantWidget } from "./participantWidget";
import ConfirmDialog from "./confirmDialog";
import BottomBar from "./bottomBar";
import { TipRecipient } from "@/lib/types";
import { toast } from "sonner";
import { approveSpendPermission } from "@/actions/spendPermission";
import { REACTION_EMOJIS } from "@/lib/constants";
import "@livekit/components-styles";
import { useLowCPUOptimizer } from "@/app/hooks/usePerfomanceOptimiser";
import { KeyboardShortcuts } from "@/lib/KeyboardShortcuts";
import { RecordingIndicator } from "@/lib/RecordingIndicator";
import { DebugMode } from "@/lib/Debug";

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
    room.on(RoomEvent.EncryptionError, handleEncryptionError);
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
    if (props.userChoices.videoEnabled) {
      room.localParticipant.setCameraEnabled(true).catch((error) => {
        handleError(error);
      });
    }
    if (props.userChoices.audioEnabled) {
      room.localParticipant.setMicrophoneEnabled(true).catch((error) => {
        handleError(error);
      });
    }

    return () => {
      room.off(RoomEvent.Disconnected, handleOnLeave);
      room.off(RoomEvent.EncryptionError, handleEncryptionError);
      room.off(RoomEvent.MediaDevicesError, handleError);
    };
  }, [room, props.connectionDetails, props.userChoices]);

  const lowPowerMode = useLowCPUOptimizer(room);

  const router = useRouter();
  const handleOnLeave = React.useCallback(() => router.push("/"), [router]);
  const handleError = React.useCallback((error: Error) => {
    console.error(error);
    alert(
      `Encountered an unexpected error, check the console logs for details: ${error.message}`,
    );
  }, []);
  const handleEncryptionError = React.useCallback((error: Error) => {
    console.error(error);
    alert(
      `Encountered an unexpected encryption error, check the console logs for details: ${error.message}`,
    );
  }, []);

  React.useEffect(() => {
    if (lowPowerMode) {
      console.warn("Low power mode enabled");
    }
  }, [lowPowerMode]);

  return (
    <div className="lk-room-container">
      <RoomContext.Provider value={room}>
        <KeyboardShortcuts />
        <TipSpaceRoomLayout />
        {/* <AudioConference /> */}
        <DebugMode />
        <RecordingIndicator />
      </RoomContext.Provider>
    </div>
  );

  //   // All hooks at the top
  //   const { user, userMetadata: localParticipantMetadata } = useUser();
  //   const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  //   const { localParticipant } = useLocalParticipant();
  //   const remoteParticipants = useRemoteParticipants({ room });
  //   const remoteParticipantsWithMetadata = remoteParticipants.map((p) => {
  //     const metadata = p.identity ? JSON.parse(p.identity) : null;
  //     return {
  //       ...p,
  //       metadata,
  //     };
  //   });
  //   const host = room.getParticipantByIdentity(roomMetadata.host.fid.toString());
  //   const hostMetadata = host?.identity
  //     ? JSON.parse(host.metadata ?? "{}")
  //     : null;
  //   const tracks = useTracks(
  //     [{ source: Track.Source.Microphone, withPlaceholder: true }],
  //     { onlySubscribed: false },
  //   );

  //   const chainId = useChainId();
  //   const [reactions, setReactions] = useState<
  //     Array<{ id: number; left: number; emoji: string }>
  //   >([]);

  //   // Reaction picker open state
  //   const [pickerOpen, setPickerOpen] = useState(false);

  //   const [tipModalOpen, setTipModalOpen] = useState(false);
  //   // Helper – send data messages (move above hooks)
  //   const sendData = useCallback(
  //     (message: Record<string, unknown>) => {
  //       try {
  //         localParticipant?.publishData(
  //           new TextEncoder().encode(JSON.stringify(message)),
  //           { reliable: true },
  //         );
  //       } catch (err) {
  //         console.error("[LiveKit] Failed to publish data", err);
  //       }
  //     },
  //     [localParticipant],
  //   );

  //   // Add floating reaction to the screen
  //   const addFloatingReaction = (emoji: string) => {
  //     const id = Date.now();
  //     setReactions((prev) => [
  //       ...prev,
  //       { id, left: Math.random() * 80 + 10, emoji },
  //     ]);
  //     setTimeout(
  //       () => setReactions((prev) => prev.filter((r) => r.id !== id)),
  //       3000,
  //     );
  //   };

  //   // Recipients: host + speakers
  //   // Build host recipient and speaker recipients, then filter out any without a wallet address
  //   const hostRecipient = {
  //     id: roomMetadata.host.fid,
  //     name: roomMetadata.host.displayName || roomMetadata.host.username || "Host",
  //     walletAddress: roomMetadata.host.address,
  //   };

  //   const speakerRecipients = room.activeSpeakers.map((s) => {
  //     const speakerMetadata: ParticipantMetadata = s.metadata
  //       ? JSON.parse(s.metadata)
  //       : null;

  //     const name = speakerMetadata?.displayName || `Speaker ${s.name}`;
  //     const walletAddress = speakerMetadata?.address;

  //     return {
  //       identity: s.identity,
  //       name,
  //       walletAddress,
  //     };
  //   });

  //   // Only include recipients with a non-null, non-undefined walletAddress
  //   const recipients: TipRecipient[] = [
  //     hostRecipient,
  //     ...speakerRecipients,
  //   ].filter((r): r is TipRecipient => !!r.walletAddress);

  //   //   const { onLeaveRoom, leaveLoading } = useLeaveRoom({
  //   //     room,
  //   //     user: user,
  //   //     space: roomMetadata,
  //   //     router,
  //   //     toast,
  //   //   });

  //   const { handleSendReaction, reactionLoading } = useTipReaction({
  //     user: user,
  //     hostId: roomMetadata.host.fid.toString(),
  //     spaceId: room.name,
  //     chainId,
  //     approveSpendPermission,
  //     sendData,
  //     addFloatingReaction,
  //   });

  //   // Host participant

  //   // Listeners are remote participants who are not currently speaking
  //   const listeners = remoteParticipants.filter(
  //     (p) => !room.activeSpeakers.includes(p),
  //   );

  //   // Host: accept hand-raise (invite to speak)

  //   const toggleMic = useCallback(() => {
  //     if (room.localParticipant) {
  //       room.localParticipant.setMicrophoneEnabled(
  //         !room.localParticipant.isMicrophoneEnabled,
  //       );
  //     }
  //   }, [room]);

  //   useEffect(() => {
  //     const handleData = (payload: Uint8Array) => {
  //       try {
  //         const msg = JSON.parse(new TextDecoder().decode(payload));
  //         switch (msg.type) {
  //           case "inviteSpeak":
  //             // Listener granted permission to speak -> unmute if the message is for us
  //             if (
  //               room.localParticipant &&
  //               msg.sid === room.localParticipant.sid
  //             ) {
  //               room.localParticipant.setMicrophoneEnabled(true);
  //             }
  //             break;
  //           case "reaction":
  //             if (msg.reactionType) {
  //               const emoji = REACTION_EMOJIS[msg.reactionType as ReactionType];
  //               if (emoji) addFloatingReaction(emoji);
  //             }
  //             break;
  //           case "muteRequest":
  //             if (
  //               room.localParticipant &&
  //               msg.sid === room.localParticipant.sid
  //             ) {
  //               room.localParticipant.setMicrophoneEnabled(false);
  //             }
  //             break;
  //           case "demoteSpeaker":
  //             if (
  //               room.localParticipant &&
  //               msg.sid === room.localParticipant.sid
  //             ) {
  //               room.localParticipant.setMicrophoneEnabled(false);
  //               // Clear handRaised and other speaker metadata to move back to listener view
  //               try {
  //                 const meta = room.localParticipant.metadata
  //                   ? JSON.parse(room.localParticipant.metadata)
  //                   : {};
  //                 delete meta.handRaised;
  //                 room.localParticipant.setMetadata(JSON.stringify(meta));
  //               } catch {}
  //             }
  //             break;
  //           default:
  //             break;
  //         }
  //       } catch (err) {
  //         console.error("[LiveKit] Failed to handle data", err);
  //       }
  //     };

  //     room.on(RoomEvent.DataReceived, handleData);
  //     return () => {
  //       room.off(RoomEvent.DataReceived, handleData);
  //     };
  //   }, [room]);
  //   // Guard for user
  //   if (!user) {
  //     return <div>user not found</div>;
  //   }

  //   // If the room does not exist, show a gentle error message
  //   if (!room) {
  //     return (
  //       <div className="flex flex-col items-center justify-center min-h-screen text-center px-6">
  //         <h2 className="text-2xl font-bold mb-2">Space Not Found</h2>
  //         <p className="text-muted-foreground mb-6">
  //           Sorry, this Space doesn&apos;t exist or has ended. <br />
  //           Please check the link or return to the homepage to discover live
  //           Spaces.
  //         </p>
  //         <a
  //           href="/"
  //           className="inline-block px-6 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition"
  //         >
  //           {" "}
  //           Back to Home{" "}
  //         </a>
  //       </div>
  //     );
  //   }

  //   // If the space has ended (host left), show a message and block further interaction
  //   if (roomMetadata.ended) {
  //     return (
  //       <div className="flex flex-col items-center justify-center min-h-screen text-center px-6">
  //         <h2 className="text-2xl font-bold mb-2">Space Ended</h2>
  //         <p className="text-muted-foreground mb-6">
  //           The host has ended this Space. <br />
  //           Thank you for joining!
  //         </p>
  //         <a
  //           href="/"
  //           className="inline-block px-6 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition"
  //         >
  //           Back to Home
  //         </a>
  //       </div>
  //     );
  //   }
  //   return (
  //     <div className="gap-4 min-h-screen bg-background text-foreground">
  //       {/* Network banner */}
  //       <ConnectionStateToast room={room} />

  //       <header className="flex justify-between px-4 py-2 bg-card/80 backdrop-blur z-40">
  //         <button
  //           className="text-red-500 font-semibold"
  //           onClick={() => setConfirmDialogOpen(true)}
  //         >
  //           {roomMetadata.host.fid === user.id ? "End" : "Leave"}
  //         </button>
  //       </header>
  //       {/* Room Title */}
  //       <h1
  //         className="px-6 text-lg font-bold leading-snug mt-4"
  //         data-testid="space-title"
  //       >
  //         {roomMetadata.title || "Untitled Space"}
  //       </h1>

  //       {/* Avatars for host, speakers, and listeners */}
  //       <GridLayout
  //         tracks={tracks}
  //         style={{ height: "calc(100vh - var(--lk-control-bar-height))" }}
  //       >
  //         <ParticipantAudioTile />
  //       </GridLayout>

  //       {/* Avatars for host, speakers, and listeners */}
  //       <div className="flex px-6 py-4 gap-4 flex-1">
  //         {/* Host */}
  //         {host && <ParticipantWidget p={host} roleLabel={Role.HOST} />}
  //         {/* Speakers */}
  //         {room.activeSpeakers.map((s) => (
  //           <ParticipantWidget key={s.identity} p={s} roleLabel={Role.SPEAKER} />
  //         ))}
  //         {/* Listeners */}
  //         {listeners.map((l: Participant) => (
  //           <ParticipantWidget key={l.identity} p={l} roleLabel={Role.LISTENER} />
  //         ))}
  //       </div>

  //       {/* Confirm leave dialog */}
  //       {/* {confirmDialogOpen && (
  //         <ConfirmDialog
  //           title="Leave Room"
  //           subtitle="Are you sure you want to leave the room?"
  //           confirmLabel={
  //             roomMetadata.host.fid === user.id ? "End Space" : "Leave"
  //           }
  //           onCancel={() => setConfirmDialogOpen(false)}
  //           onConfirm={() => {}}
  //           loading={false}
  //         />
  //       )} */}

  //       {/* Bottom bar */}
  //       <BottomBar
  //         onOpenReactionPicker={() => setPickerOpen(true)}
  //         onTipClick={() => setTipModalOpen(true)}
  //         onInviteClick={onInviteClick}
  //       />

  //       {pickerOpen && (
  //         <ReactionPicker
  //           onPick={(t) => handleSendReaction(t)}
  //           onClose={() => {
  //             setPickerOpen(false);
  //           }}
  //           loading={reactionLoading}
  //         />
  //       )}

  //       <ControlBar />
  //       {/* Floating reactions overlay */}
  //       <ReactionOverlay reactions={reactions} />
  //       <TipModal
  //         open={tipModalOpen}
  //         onClose={() => setTipModalOpen(false)}
  //         recipients={recipients}
  //         defaultRecipientId={hostRecipient.id}
  //         userId={user.id}
  //         spaceId={room.name}
  //         onTipSuccess={() => {
  //           setTipModalOpen(false);
  //           if (toast) toast.success("Tip sent!");
  //         }}
  //       />
  //     </div>
  //   );
}

export function TipSpaceRoomLayout() {
  const [widgetState, setWidgetState] = React.useState<WidgetState>({
    showChat: false,
    unreadMessages: 0,
  });

  const audioTracks = useTracks([Track.Source.Microphone]);

  return (
    <LayoutContextProvider onWidgetChange={setWidgetState}>
      <div className="">
        <div className="">
          <TrackLoop tracks={audioTracks}>
            <ParticipantAudioTile />
          </TrackLoop>
        </div>
        <BottomBar
          onOpenReactionPicker={() => {}}
          onTipClick={() => {}}
          onInviteClick={() => {}}
        />
        {widgetState.showChat && <Chat />}
      </div>
    </LayoutContextProvider>
  );
}
