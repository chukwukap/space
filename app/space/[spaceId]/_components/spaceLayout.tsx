"use client";

import { useHandRaise } from "@/app/hooks/useHandRaise";
import { useLeaveRoom } from "@/app/hooks/useLeaveRoom";
import { useTipReaction } from "@/app/hooks/useTipReaction";
import { useUser } from "@/app/providers/userProvider";
import { ReactionType } from "@/lib/generated/prisma";
import { ParticipantMetadata, SpaceWithHostParticipant } from "@/lib/types";
import { useRoomContext } from "@livekit/components-react";
import { ConnectionState, Participant, RoomEvent } from "livekit-client";
import { useRouter } from "next/navigation";
import { useState, useRef, useCallback, useEffect } from "react";
import { useChainId } from "wagmi";
import HandRaiseQueue from "./HandRaiseQueue";
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

export default function SpaceLayout({
  onInviteClick,
  space,
}: {
  onInviteClick: () => void;
  space: SpaceWithHostParticipant;
}) {
  // All hooks at the top
  const { user } = useUser();
  const room = useRoomContext();
  const router = useRouter();
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);

  const chainId = useChainId();
  const [spaceEnded, setSpaceEnded] = useState(false);
  const endedRef = useRef(false);
  const [likes, setLikes] = useState(0);
  const [reactions, setReactions] = useState<
    Array<{ id: number; left: number; emoji: string }>
  >([]);

  // Add floating reaction to the screen
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

  // Network state
  const [networkState, setNetworkState] = useState<ConnectionState | null>(
    null,
  );

  // Reaction picker open state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [handRaiseQueue, setHandRaiseQueue] = useState<Participant[]>([]);

  const [tipModalOpen, setTipModalOpen] = useState(false);
  // Helper – send data messages (move above hooks)
  const sendData = useCallback(
    (message: Record<string, unknown>) => {
      try {
        room.localParticipant?.publishData(
          new TextEncoder().encode(JSON.stringify(message)),
          //   { reliable: true },
        );
      } catch (err) {
        console.error("[LiveKit] Failed to publish data", err);
      }
    },
    [room],
  );

  // Recipients: host + speakers
  // Build host recipient and speaker recipients, then filter out any without a wallet address
  const hostRecipient = {
    id: space.host.id,
    name: space.host.displayName || space.host.username || "Host",
    walletAddress: space.host.address,
  };

  const speakerRecipients = room.activeSpeakers.map((s) => {
    const participantMeta: ParticipantMetadata = s.metadata
      ? JSON.parse(s.metadata)
      : { userDbId: null, fid: null, pfpUrl: null, walletAddress: null };

    const name = s.name || `Speaker ${s.identity}`;
    // Try to find the corresponding participant in space.participants (if available)
    const participant = space.participants.find(
      (p) => p.user && p.user.id.toString() === s.identity,
    );
    const walletAddress =
      participantMeta?.walletAddress ||
      participant?.user?.address ||
      hostRecipient.walletAddress;

    return {
      id: participantMeta?.userDbId ?? Number(s.identity),
      name,
      walletAddress,
    };
  });

  // Only include recipients with a non-null, non-undefined walletAddress
  const recipients: TipRecipient[] = [
    hostRecipient,
    ...speakerRecipients,
  ].filter((r): r is TipRecipient => !!r.walletAddress);

  const { onLeaveRoom, leaveLoading } = useLeaveRoom({
    room,
    user: user,
    space,
    router,
    toast,
  });
  const { handleSendReaction, reactionLoading } = useTipReaction({
    user: user,
    hostId: space.hostId.toString(),
    spaceId: space.id,
    chainId,
    approveSpendPermission,
    sendData,
    addFloatingReaction,
    setLikes,
  });
  const { onRaiseHand, clearHandRaise, handRaiseLoading } = useHandRaise({
    room,
    sendData,
    toast,
  });

  // All remote participants in the room
  const remoteParticipants = Array.from(room.remoteParticipants.values());

  // Host participant
  const host = room.getParticipantByIdentity(space.hostId.toString());

  // Listeners are remote participants who are not currently speaking
  const listeners = remoteParticipants.filter(
    (p) => !room.activeSpeakers.includes(p),
  );

  // Helper to check if a participant has handRaised in metadata
  const isHandRaised = (p: Participant) => {
    try {
      if (!p.metadata) return false;
      const meta = JSON.parse(p.metadata);
      return !!meta.handRaised;
    } catch {
      return false;
    }
  };

  // Update hand-raise queue when participant metadata changes
  useEffect(() => {
    const updateQueue = () => {
      const queue = Array.from(room.remoteParticipants.values()).filter(
        isHandRaised,
      );
      setHandRaiseQueue(queue);
    };
    updateQueue();
    room.on(RoomEvent.ParticipantMetadataChanged, updateQueue);
    room.on(RoomEvent.ParticipantConnected, updateQueue);
    room.on(RoomEvent.ParticipantDisconnected, updateQueue);
    return () => {
      room.off(RoomEvent.ParticipantMetadataChanged, updateQueue);
      room.off(RoomEvent.ParticipantConnected, updateQueue);
      room.off(RoomEvent.ParticipantDisconnected, updateQueue);
    };
  }, [room]);

  // Host: accept hand-raise (invite to speak)
  const handleAcceptHand = (sid: string) => {
    sendData({ type: "inviteSpeak", sid });
    // Host cannot update remote metadata; participant will update their own on invite
    setQueueOpen(false);
  };

  // Host: reject hand-raise
  const handleRejectHand = (sid: string) => {
    sendData({ type: "rejectHand", sid });
    // Host cannot update remote metadata; participant will update their own on reject
    setQueueOpen(false);
  };

  // Listen for rejectHand data message (clear handRaised for local participant)
  useEffect(() => {
    const handleData = async (payload: Uint8Array) => {
      try {
        const msg = JSON.parse(new TextDecoder().decode(payload));
        if (
          msg.type === "rejectHand" &&
          room.localParticipant &&
          msg.sid === room.localParticipant.sid
        ) {
          await clearHandRaise();
        }
      } catch {}
    };
    room.on(RoomEvent.DataReceived, handleData);
    return () => {
      room.off(RoomEvent.DataReceived, handleData);
    };
  }, [room, clearHandRaise]);

  // Listen for demoteSpeaker data message (clear handRaised for local participant)
  useEffect(() => {
    const handleData = async (payload: Uint8Array) => {
      try {
        const msg = JSON.parse(new TextDecoder().decode(payload));
        if (
          msg.type === "demoteSpeaker" &&
          room.localParticipant &&
          msg.sid === room.localParticipant.sid
        ) {
          await clearHandRaise();
        }
      } catch {}
    };
    room.on(RoomEvent.DataReceived, handleData);
    return () => {
      room.off(RoomEvent.DataReceived, handleData);
    };
  }, [room, clearHandRaise]);
  /* Rerender on active speaker change */
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const cb = () => forceUpdate((c) => c + 1);
    room.on(RoomEvent.ActiveSpeakersChanged, cb);
    return () => {
      room.off(RoomEvent.ActiveSpeakersChanged, cb);
    };
  }, [room]);

  // --- Track if the space has ended (host left) ---
  useEffect(() => {
    const handleParticipantConnected = (p: Participant) => {
      console.log("participant connected", p);
    };

    // If the host leaves, end the space for everyone
    const handleParticipantDisconnected = (p: Participant) => {
      if (host?.sid === p.sid) {
        // Only run once
        if (!endedRef.current) {
          endedRef.current = true;
          setSpaceEnded(true);
          // Optionally, disconnect from the room after a short delay to allow UI to show the ended message
          setTimeout(() => {
            try {
              room?.disconnect();
            } catch (e) {
              console.error("Error disconnecting from room", e);
            }
          }, 1000);
        }
      }
    };

    const handleMetadataChanged = (
      _meta: string | undefined,
      p: Participant,
    ) => {
      try {
        // Defensive: p may be undefined/null
        if (!p) return;
        // Defensive: p.metadata may be undefined
        console.log("metadata changed", p?.metadata ?? null);
        // const meta = p.metadata ? JSON.parse(p.metadata) : {};
        // if (meta.handRaised) spaceStore.enqueueHand(p);
        // else spaceStore.dequeueHand(p.sid);
      } catch {}
    };

    room.on(RoomEvent.ParticipantConnected, handleParticipantConnected);
    room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
    room.on(RoomEvent.ParticipantMetadataChanged, handleMetadataChanged);

    return () => {
      room.off(RoomEvent.ParticipantConnected, handleParticipantConnected);
      room.off(
        RoomEvent.ParticipantDisconnected,
        handleParticipantDisconnected,
      );
      room.off(RoomEvent.ParticipantMetadataChanged, handleMetadataChanged);
    };
  }, [room, host]);

  const toggleMic = useCallback(() => {
    if (room.localParticipant) {
      room.localParticipant.setMicrophoneEnabled(
        !room.localParticipant.isMicrophoneEnabled,
      );
    }
  }, [room]);

  /** ------------------------------------------------------------------
   * Data message handler (invite, reactions, etc.)
   * ----------------------------------------------------------------- */
  useEffect(() => {
    const onStateChanged = () => {
      const state = room.state;
      if (state !== ConnectionState.Connected) {
        setNetworkState(state);
      } else {
        setNetworkState(null);
      }
    };
    onStateChanged();
    room.on(RoomEvent.ConnectionStateChanged, onStateChanged);
    return () => {
      room.off(RoomEvent.ConnectionStateChanged, onStateChanged);
    };
  }, [room]);

  useEffect(() => {
    const handleData = (payload: Uint8Array) => {
      try {
        const msg = JSON.parse(new TextDecoder().decode(payload));
        switch (msg.type) {
          case "inviteSpeak":
            // Listener granted permission to speak -> unmute if the message is for us
            if (
              room.localParticipant &&
              msg.sid === room.localParticipant.sid
            ) {
              room.localParticipant.setMicrophoneEnabled(true);
            }
            break;
          case "reaction":
            if (msg.reactionType) {
              const emoji = REACTION_EMOJIS[msg.reactionType as ReactionType];
              if (emoji) addFloatingReaction(emoji);
            }
            setLikes((c) => c + 1);
            break;
          case "muteRequest":
            if (
              room.localParticipant &&
              msg.sid === room.localParticipant.sid
            ) {
              room.localParticipant.setMicrophoneEnabled(false);
            }
            break;
          case "demoteSpeaker":
            if (
              room.localParticipant &&
              msg.sid === room.localParticipant.sid
            ) {
              room.localParticipant.setMicrophoneEnabled(false);
              // Clear handRaised and other speaker metadata to move back to listener view
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
  }, [room]);
  // Guard for user
  if (!user) {
    return <div>user not found</div>;
  }

  // If the room does not exist, show a gentle error message
  if (!room) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-6">
        <h2 className="text-2xl font-bold mb-2">Space Not Found</h2>
        <p className="text-muted-foreground mb-6">
          Sorry, this Space doesn&apos;t exist or has ended. <br />
          Please check the link or return to the homepage to discover live
          Spaces.
        </p>
        <a
          href="/"
          className="inline-block px-6 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition"
        >
          {" "}
          Back to Home{" "}
        </a>
      </div>
    );
  }

  // If the space has ended (host left), show a message and block further interaction
  if (spaceEnded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-6">
        <h2 className="text-2xl font-bold mb-2">Space Ended</h2>
        <p className="text-muted-foreground mb-6">
          The host has ended this Space. <br />
          Thank you for joining!
        </p>
        <a
          href="/"
          className="inline-block px-6 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition"
        >
          Back to Home
        </a>
      </div>
    );
  }
  return (
    <div className="gap-4 min-h-screen bg-background text-foreground">
      {/* Network banner */}
      {networkState && (
        <div className="w-full bg-yellow-600 text-center text-sm py-1 z-50">
          {networkState === ConnectionState.Reconnecting
            ? "Reconnecting…"
            : networkState === ConnectionState.Disconnected
              ? "Disconnected"
              : networkState.toString()}
        </div>
      )}

      <header className="flex justify-between px-4 py-2 bg-card/80 backdrop-blur z-40">
        <div className="flex items-center gap-3">
          {room.isRecording ? (
            <span className="bg-red-600 animate-pulse rounded px-1.5 py-0.5 text-[10px] font-semibold disabled:opacity-50">
              REC
            </span>
          ) : null}
          <span className="text-xs text-muted-foreground">
            {room.numParticipants} · listeners
          </span>
        </div>
        <button
          className="text-red-500 font-semibold"
          onClick={() => setConfirmDialogOpen(true)}
        >
          {space.host.id === user.id ? "End" : "Leave"}
        </button>
      </header>
      {/* Room Title */}
      <h1
        className="px-6 text-lg font-bold leading-snug mt-4"
        data-testid="space-title"
      >
        {/* {title || "Untitled Space"} */}
      </h1>

      {/* Avatars for host, speakers, and listeners */}
      <div className="flex px-6 py-4 gap-4 flex-1">
        {/* Host */}
        {host && <ParticipantWidget p={host} isHost roleLabel="Host" />}
        {/* Speakers */}
        {room.activeSpeakers.map((s) => (
          <ParticipantWidget
            key={s.identity}
            p={s}
            onToggleRemoteMute={
              space.host.id === user.id
                ? () => sendData({ type: "muteRequest", sid: s.sid })
                : undefined
            }
            onDemote={
              space.host.id === user.id
                ? () => sendData({ type: "demoteSpeaker", sid: s.sid })
                : undefined
            }
            roleLabel="Speaker"
          />
        ))}
        {/* Listeners */}
        {listeners.map((l: Participant) => (
          <ParticipantWidget
            key={l.identity}
            p={l}
            onInvite={() => {}}
            onToggleRemoteMute={() => {}}
            onDemote={() => {}}
            roleLabel="Listener"
          />
        ))}
      </div>

      {/* Confirm leave dialog */}
      {confirmDialogOpen && (
        <ConfirmDialog
          title="Leave Room"
          subtitle="Are you sure you want to leave the room?"
          confirmLabel={space.host.id === user.id ? "End Space" : "Leave"}
          onCancel={() => setConfirmDialogOpen(false)}
          onConfirm={onLeaveRoom}
          loading={leaveLoading}
        />
      )}

      {/* Bottom bar */}
      <BottomBar
        className="fixed bottom-0 left-0 right-0"
        p={room.localParticipant}
        onToggleMic={toggleMic}
        onRaiseHand={onRaiseHand}
        onOpenReactionPicker={() => setPickerOpen(true)}
        onTipClick={() => setTipModalOpen(true)}
        likes={likes}
        handRaiseCount={handRaiseQueue.length}
        isHost={space.host.id === user.id}
        onQueueClick={() => setQueueOpen(true)}
        onInviteClick={onInviteClick}
        handRaiseLoading={handRaiseLoading}
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

      {space.host.id === user.id && queueOpen && (
        <HandRaiseQueue
          list={handRaiseQueue}
          onClose={() => setQueueOpen(false)}
          onAccept={handleAcceptHand}
          onReject={handleRejectHand}
        />
      )}

      {/* Floating reactions overlay */}
      <ReactionOverlay reactions={reactions} />
      <TipModal
        open={tipModalOpen}
        onClose={() => setTipModalOpen(false)}
        recipients={recipients}
        defaultRecipientId={hostRecipient.id}
        userId={user.id}
        spaceId={space.id}
        onTipSuccess={() => {
          setTipModalOpen(false);
          if (toast) toast.success("Tip sent!");
        }}
      />
    </div>
  );
}
