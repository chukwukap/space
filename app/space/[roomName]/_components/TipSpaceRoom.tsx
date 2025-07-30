"use client";

import { useUser } from "@/app/providers/userProvider";
import {
  ConnectionDetails,
  ParticipantMetadata,
  PendingRequest,
  TipRecipient,
} from "@/lib/types";
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
  useSortedParticipants,
  useParticipants,
} from "@livekit/components-react";
import {
  AudioCaptureOptions,
  AudioPresets,
  Room,
  RoomConnectOptions,
  RoomEvent,
  RoomOptions,
} from "livekit-client";
import { useRouter } from "next/navigation";
import React, { useState, useCallback, useEffect, useMemo } from "react";

import TipModal from "./TipModal";
import BottomBar from "./bottomBar";
import { toast } from "sonner";

import { useLowCPUOptimizer } from "@/app/hooks/usePerfomanceOptimiser";
import { KeyboardShortcuts } from "@/lib/KeyboardShortcuts";
import { CustomParticipantTile } from "./participantTiile";

import MobileHeader from "@/app/_components/mobileHeader";
import PendingRequestToSpeak from "./pendingRequestToSpeak";

/**
 * ReactionMap: { [participantSid]: { emoji: string, timestamp: number } }
 * Used to track which participant is currently showing which reaction.
 */
type ReactionMap = Record<string, { emoji: string; timestamp: number }>;

export default function TipSpaceRoom(props: {
  userChoices: LocalUserChoices;
  connectionDetails: ConnectionDetails;
  title?: string;
  options: {
    hq: boolean;
  };
}) {
  // Room setup
  const roomOptions = React.useMemo((): RoomOptions => {
    const audioCaptureDefaults: AudioCaptureOptions = {
      deviceId: props.userChoices.audioDeviceId ?? undefined,
      ...AudioPresets.musicHighQualityStereo,
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
  const connectOptions = React.useMemo(
    (): RoomConnectOptions => ({ autoSubscribe: true }),
    [],
  );

  const handleError = React.useCallback((error: Error) => {
    console.error(error);
  }, []);

  React.useEffect(() => {
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
      room.localParticipant.setMicrophoneEnabled(true).catch(handleError);
    } else {
      room.localParticipant.setCameraEnabled(false).catch(handleError);
      room.localParticipant.setMicrophoneEnabled(false).catch(handleError);
    }

    return () => {
      room.off(RoomEvent.MediaDevicesError, handleError);
    };
  }, [
    room,
    props.connectionDetails,
    props.userChoices,
    connectOptions,
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
    <div className="h-full w-full flex flex-col max-w-screen-sm mx-auto">
      <RoomContext.Provider value={room}>
        <ConnectionStateToast
          room={room}
          className="absolute top-0 left-0 z-50"
        />
        <KeyboardShortcuts />
        <TipSpaceRoomLayout />
        <RoomAudioRenderer />
      </RoomContext.Provider>
    </div>
  );
}

export function TipSpaceRoomLayout() {
  const room = useRoomContext();

  const [widgetState, setWidgetState] = useState<WidgetState>({
    showChat: false,
    unreadMessages: 0,
  });
  const { user } = useUser();
  const participants = useParticipants();
  const sortedParticipants = useSortedParticipants(participants);

  const { localParticipant } = useLocalParticipant();

  const localParticipantMetadata = localParticipant?.metadata
    ? (JSON.parse(localParticipant.metadata ?? "{}") as ParticipantMetadata)
    : null;

  // --- New ReactionMap state for current reactions ---
  const [reactionMap, setReactionMap] = useState<ReactionMap>({});

  // Tip modal open state
  const [tipModalOpen, setTipModalOpen] = useState(false);

  // Pending "request to speak" requests (host only)
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);

  // Track if local user has requested to speak (for UI)
  const [hasRequested, setHasRequested] = useState(false);

  /**
   * Helper – send data messages to room using LiveKit's reliable data channel.
   * All messages are stringified and encoded for security and compatibility.
   */
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
   * Request to speak: send a data message to hosts/moderators.
   */
  const requestToSpeak = useCallback(() => {
    if (!localParticipant) return;
    try {
      sendData({
        type: "requestToSpeak",
        sid: localParticipant.sid,
        user: {
          name: localParticipant.name,
          metadata: localParticipant.metadata,
        },
        timestamp: Date.now(),
      });
      setHasRequested(true);
      toast.success("Request to speak sent");
    } catch (error) {
      console.error("[RequestToSpeak] error", error);
      toast.error("Failed to send request");
    }
  }, [localParticipant, sendData]);

  /**
   * Host/mod: Approve a request to speak by calling the backend API.
   */
  const onApprove = useCallback(
    async (participantSid: string) => {
      const isHost = localParticipantMetadata?.isHost;
      if (!isHost) {
        toast.error("Only hosts can approve requests");
        return;
      }
      try {
        const res = await fetch("/api/room/invite", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            roomName: room.name,
            identity: participantSid,
          }),
        });

        if (!res.ok) {
          throw new Error("Failed to invite participant");
        }

        setPendingRequests((prev) =>
          prev.filter((req) => req.sid !== participantSid),
        );
        toast.success("Invite sent");
      } catch (error) {
        console.error("[InviteToSpeak] error", error);
        toast.error("Failed to send invite");
      }
    },
    [localParticipantMetadata, room.name],
  );

  /**
   * Listen for incoming data messages: requestToSpeak, inviteToSpeak, and reactions.
   * Handles both host and participant logic.
   */
  useEffect(() => {
    const handleData = (payload: Uint8Array) => {
      try {
        const msg = JSON.parse(new TextDecoder().decode(payload));
        if (!msg?.type) return;
        switch (msg.type) {
          case "requestToSpeak":
            if (localParticipantMetadata?.isHost) {
              setPendingRequests((prev) => {
                if (prev.some((r) => r.sid === msg.sid)) return prev;
                return [
                  ...prev,
                  {
                    sid: msg.sid,
                    user: msg.user,
                    timestamp: msg.timestamp,
                  },
                ];
              });
              toast("New request to speak");
            }
            break;
          case "reaction":
            // Update ReactionMap for this participant
            if (msg.sid && msg.emoji) {
              setReactionMap((prev) => ({
                ...prev,
                [msg.sid]: { emoji: msg.emoji, timestamp: msg.timestamp },
              }));
              // Remove the reaction after 3 seconds for ephemeral effect
              setTimeout(() => {
                setReactionMap((prev) => {
                  // Only remove if the timestamp matches (avoid race)
                  if (prev[msg.sid]?.timestamp === msg.timestamp) {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { [msg.sid]: _, ...rest } = prev;
                    return rest;
                  }
                  return prev;
                });
              }, 3000);
            }
            break;
          default:
            // Ignore unknown message types for security.
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
  }, [room, localParticipant, localParticipantMetadata]);

  // Recipients: host + speakers
  const recipients: TipRecipient[] = useMemo(() => {
    const recipients = sortedParticipants
      .map((s) => {
        const speakerMetadata: ParticipantMetadata = JSON.parse(
          s.metadata ?? "{}",
        ) as ParticipantMetadata;
        const name =
          speakerMetadata?.fcContext?.farcasterUser.displayName ||
          `Speaker ${s.name}`;
        console.log("[TipSpaceRoomLayout] s", s);
        console.log(
          "[TipSpaceRoomLayout] speakerMetadata",
          speakerMetadata,
          s.metadata,
        );
        return {
          fid: speakerMetadata?.fcContext?.farcasterUser.fid ?? null,
          name,
          pfpUrl: speakerMetadata?.fcContext?.farcasterUser.pfpUrl,
          address: speakerMetadata?.fcContext?.farcasterUser.address,
        };
      })
      .filter(
        (r) => r.fid,
        // r.fid !== localParticipantMetadata?.fcContext?.farcasterUser.fid,
      );
    console.log("[TipSpaceRoomLayout] recipients", recipients);
    return recipients;
  }, [sortedParticipants]);

  // --- Reaction sending logic: broadcast to room via LiveKit data channel ---
  const handleSendReaction = useCallback(
    (emoji: string) => {
      if (!localParticipant) return;
      try {
        localParticipant.publishData(
          new TextEncoder().encode(
            JSON.stringify({
              type: "reaction",
              sid: localParticipant.sid,
              emoji,
              timestamp: Date.now(),
            }),
          ),
          // { reliable: true },
        );
      } catch (err) {
        console.error("[LiveKit] Failed to publish reaction", err);
      }
    },
    [localParticipant],
  );

  const router = useRouter();

  const handleOnLeave = React.useCallback(async () => {
    if (localParticipantMetadata?.isHost) {
      try {
        // Call backend to rug the space
        await fetch("/api/room/rug", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomName: room.name }),
        });
      } catch (err) {
        // Log for audit, but do not leak to UI
        console.error("[RugSpace] failed", err);
      }
    }
    router.push("/");
  }, [router, localParticipantMetadata, room.name]);

  React.useEffect(() => {
    room.on(RoomEvent.Disconnected, handleOnLeave);

    return () => {
      room.off(RoomEvent.Disconnected, handleOnLeave);
    };
  }, [room, handleOnLeave]);

  return (
    <LayoutContextProvider onWidgetChange={setWidgetState}>
      <div className="flex flex-col gap-2">
        <MobileHeader
          showBack={true}
          lowerComponent={
            <DisconnectButton className="text-sm text-destructive font-medium">
              {"Leave"}
            </DisconnectButton>
          }
        />
        {/* Room Title Area */}
        <section className=" bg-background mt-5 mx-2">
          <h1
            className="text-xl font-bold leading-tight truncate max-w-full"
            data-testid="space-title"
            style={{ fontFamily: "Sora, sans-serif" }}
            title={localParticipantMetadata?.title ?? ""}
          >
            {localParticipantMetadata?.title ?? ""}
          </h1>
        </section>
        <div className="flex flex-col gap-6 mx-2">
          {/* Host & Speakers horizontal list */}
          <div
            className="w-full px-4 flex gap-4 items-center"
            data-testid="speakers-row"
          >
            {sortedParticipants.map((sp) => (
              <CustomParticipantTile
                key={sp.sid}
                participant={sp}
                // Pass current reaction for this participant, if any
                reaction={reactionMap[sp.sid]?.emoji}
              />
            ))}
          </div>
        </div>

        <PendingRequestToSpeak
          requests={pendingRequests}
          onApprove={onApprove}
          onReject={() => {
            toast.warning("Rejecting requests is not implemented");
          }}
        />

        <BottomBar
          roomName={room.name}
          onBasedTipClick={() => setTipModalOpen(true)}
          hasRequested={hasRequested}
          requestToSpeak={requestToSpeak}
          onSendReaction={handleSendReaction}
        />
        {widgetState.showChat && <Chat />}
        <TipModal
          open={tipModalOpen}
          onClose={() => setTipModalOpen(false)}
          recipients={recipients}
          senderFid={user?.fid ?? undefined}
          onTipSuccess={() => {
            setTipModalOpen(false);
            if (toast) toast.success("Tip sent!");
          }}
          spaceId={room.name}
        />
      </div>
    </LayoutContextProvider>
  );
}
