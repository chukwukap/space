"use client";

import {
  LiveKitRoom,
  RoomAudioRenderer,
  useRoomContext,
  useToken,
} from "@livekit/components-react";
import { FireFlame, HandCash, Heart, Percentage } from "iconoir-react";
import { useMemo, useEffect, useState, useCallback, useRef } from "react";
import {
  ConnectionState,
  Participant as LKParticipant,
  RoomEvent,
} from "livekit-client";
// import "@livekit/components-styles";
import dynamic from "next/dynamic";
import { AvatarWithControls } from "./avatar";
import { useRouter } from "next/navigation";
import ReactionOverlay from "./ReactionOverlay";
import BottomBar from "./bottomBar";
import HandRaiseQueue from "./HandRaiseQueue";
import ReactionPicker, { ReactionType } from "./ReactionPicker";
import MobileHeader from "@/app/_components/mobileHeader";
import { Address } from "viem";
import {
  useAccount,
  useChainId,
  useConnect,
  useConnectors,
  useSignTypedData,
} from "wagmi";
import { ParticipantMetadata, SpaceWithHostParticipant } from "@/lib/types";
import { Laugh } from "lucide-react";
import { useUser } from "@/app/providers/userProvider";
import { getSpendPermTypedData } from "@/lib/utils";
import { approveSpendPermission } from "@/actions/spendPermission";
import { NEXT_PUBLIC_LK_SERVER_URL } from "@/lib/constants";

// Use the new reusable drawer component instead of the previous custom sheet.
const InviteDrawer = dynamic(() => import("@/app/_components/inviteDrawer"), {
  ssr: false,
});

const ConfirmDialog = dynamic(() => import("./confirmDialog"), { ssr: false });

/**
 * SpaceRoom connects the user to the LiveKit room and renders the room UI.
 */
export default function SpaceRoom({
  space,
}: {
  space: SpaceWithHostParticipant;
}) {
  const { user } = useUser();
  const roomName = space.livekitName;

  const userInfo = {
    identity: user?.id.toString(),
    name: user?.username,
    metadata: JSON.stringify({
      isHost: user ? user.id === space.hostId.toString() : false,
      pfpUrl: user?.pfpUrl ?? null,
      fid: user?.fid ?? null,
    } as ParticipantMetadata),
  };

  const localParticipantToken = useToken("/api/token", roomName, {
    userInfo,
  });

  const [inviteOpen, setInviteOpen] = useState(false);

  // If user is not found, show error message, but after all hooks
  if (!user) {
    return <div>user not found</div>;
  }

  return (
    <>
      <MobileHeader showBack />
      <LiveKitRoom
        token={localParticipantToken}
        serverUrl={NEXT_PUBLIC_LK_SERVER_URL}
      >
        <>
          {/* for testing */}
          <div className="text-xs text-muted-foreground">
            {user?.id}
            <br />
            token: {localParticipantToken}
          </div>
          <div className="text-xs text-muted-foreground">
            {user?.id}
            <br />
            token: {localParticipantToken}
          </div>
          <div className="text-xs text-muted-foreground">
            {JSON.stringify(userInfo)}
          </div>
        </>
        <SpaceLayout onInviteClick={() => setInviteOpen(true)} space={space} />

        {inviteOpen && (
          <InviteDrawer
            people={[]}
            defaultOpen={true}
            onSend={() => setInviteOpen(false)}
          />
        )}
        <RoomAudioRenderer />
      </LiveKitRoom>
    </>
  );
}

/**
 * SpaceLayout displays the current state of the room, including host, speakers, and listeners.
 * It also provides a leave button that disconnects the user securely and navigates home.
 */
function SpaceLayout({
  onInviteClick,
  space,
}: {
  onInviteClick: () => void;
  space: SpaceWithHostParticipant;
}) {
  const { user } = useUser();
  const room = useRoomContext();

  const router = useRouter();

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  // Host hand-raise queue panel state
  const [queueOpen, setQueueOpen] = useState(false);
  const account = useAccount();
  const chainId = useChainId();
  const { connectAsync } = useConnect();
  const connectors = useConnectors();
  const { signTypedDataAsync } = useSignTypedData();

  const host = room.getParticipantByIdentity(space.hostId.toString());

  // All remote participants in the room
  const remoteParticipants = Array.from(room.remoteParticipants.values());

  // Listeners are remote participants who are not currently speaking
  const listeners = remoteParticipants.filter(
    (p) => !room.activeSpeakers.includes(p),
  );

  // Determine if local participant is host (fallback to first participant)
  const isHost = host?.identity === room.localParticipant?.identity;

  /** ------------------------------------------------------------------
   * Helper – send data messages
   * ----------------------------------------------------------------- */
  const sendData = useCallback(
    (message: Record<string, unknown>) => {
      try {
        room.localParticipant?.publishData(
          new TextEncoder().encode(JSON.stringify(message)),
          { reliable: true },
        );
      } catch (err) {
        console.error("[LiveKit] Failed to publish data", err);
      }
    },
    [room],
  );

  /** ------------------------------------------------------------------
   * Local state helpers
   * ----------------------------------------------------------------- */
  const isLocalMuted = room.localParticipant?.isMicrophoneEnabled === false;

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
  const [spaceEnded, setSpaceEnded] = useState(false);
  const endedRef = useRef(false);

  useEffect(() => {
    const handleParticipantConnected = (p: LKParticipant) => {
      console.log("participant connected", p);
    };

    // If the host leaves, end the space for everyone
    const handleParticipantDisconnected = (p: LKParticipant) => {
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
      p: LKParticipant,
    ) => {
      try {
        // Defensive: p may be undefined/null
        if (!p) return;
        // Defensive: p.metadata may be undefined
        console.log("metadata changed", p.metadata ?? null);
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
      room.localParticipant.setMicrophoneEnabled(!isLocalMuted);
    }
  }, [room, isLocalMuted]);

  const raiseHand = useCallback(() => {
    try {
      if (!room.localParticipant) return;
      const meta = room.localParticipant.metadata
        ? JSON.parse(room.localParticipant.metadata)
        : {};
      meta.handRaised = true;
      room.localParticipant.setMetadata(JSON.stringify(meta));
      // Notify host
      sendData({ type: "handRaised", sid: room.localParticipant.sid });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to raise hand", err);
    }
  }, [room, sendData]);

  /** ------------------------------------------------------------------
   * Data message handler (invite, reactions, etc.)
   * ----------------------------------------------------------------- */
  const [likes, setLikes] = useState(0);

  const [reactions, setReactions] = useState<
    Array<{ id: number; left: number; emoji: React.ReactNode }>
  >([]);

  // Memoise emojis so reference is stable across renders (satisfies eslint rules)
  const reactionEmojis = useMemo<Record<ReactionType, React.ReactNode>>(
    () => ({
      heart: <Heart />,
      clap: <HandCash />,
      fire: <FireFlame />,
      lol: <Laugh />,
      hundred: <Percentage />,
    }),
    [],
  );
  /* Connection state banner */
  const [networkState, setNetworkState] = useState<ConnectionState | null>(
    null,
  );

  /* ------------------ Recording badge ------------------ */
  const recordingBadge = room.isRecording ? (
    <span className="bg-red-600 animate-pulse rounded px-1.5 py-0.5 text-[10px] font-semibold disabled:opacity-50">
      REC
    </span>
  ) : null;

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

  const addFloatingReaction = (emoji: React.ReactNode) => {
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
              const emoji = reactionEmojis[msg.reactionType as ReactionType];
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
  }, [reactionEmojis, room]);

  /** ----------------------------------------- */
  /* Reaction handling with tip                */
  /** ----------------------------------------- */
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleSendReaction = async (type: ReactionType) => {
    // optimistic display
    addFloatingReaction(reactionEmojis[type]);
    setLikes((c) => c + 1);
    sendData({ type: "reaction", reactionType: type });

    try {
      let addr = account.address;
      if (!addr) {
        const res = await connectAsync({ connector: connectors[0] });
        addr = res.accounts[0] as Address;
      }
      if (!addr) return;
      const spendPerm = getSpendPermTypedData(addr, chainId);

      const signature = await signTypedDataAsync(spendPerm);

      await approveSpendPermission(
        spendPerm.message,
        signature,
        parseInt(user?.id ?? "0"),
      );
    } catch (err) {
      console.error("[reaction tip] failed", err);
    }
  };

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
              ? "Disconnected. Rejoining…"
              : networkState.toString()}
        </div>
      )}

      <header className="flex justify-between px-4 py-2 bg-card/80 backdrop-blur z-40">
        <div className="flex items-center gap-3">
          {recordingBadge}
          <span className="text-xs text-muted-foreground">
            {room.numParticipants} · listeners
          </span>
        </div>
        <button
          className="text-red-500 font-semibold"
          onClick={() => setConfirmDialogOpen(true)}
        >
          {isHost ? "End" : "Leave"}
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
        <AvatarWithControls
          p={host as LKParticipant}
          size={56}
          isSpeaking={host?.isSpeaking}
          isHost
          remoteMuted={!host?.isMicrophoneEnabled}
          roleLabel="Host"
        />
        {/* Speakers */}
        {room.activeSpeakers.map((s) => (
          <AvatarWithControls
            key={s.identity}
            p={s as LKParticipant}
            size={56}
            onToggleRemoteMute={
              isHost
                ? () => sendData({ type: "muteRequest", sid: s.sid })
                : undefined
            }
            onDemote={
              isHost
                ? () => sendData({ type: "demoteSpeaker", sid: s.sid })
                : undefined
            }
            isSpeaking={s.isSpeaking}
            remoteMuted={!s.isMicrophoneEnabled}
            roleLabel="Speaker"
          />
        ))}
        {/* Listeners */}
        {listeners.map((l) => (
          <AvatarWithControls
            key={l.identity}
            p={l as LKParticipant}
            size={56}
            isHandRaised={(() => {
              try {
                // Defensive: l may be undefined/null
                if (!l) return false;
                // Defensive: l.metadata may be undefined
                const meta = l.metadata ? JSON.parse(l.metadata) : {};
                return !!meta.handRaised;
              } catch {
                return false;
              }
            })()}
            onInvite={(() => {
              // Show invite button only for host & if participant raised hand
              const isHand = (() => {
                try {
                  if (!l) return false;
                  const meta = l.metadata ? JSON.parse(l.metadata) : {};
                  return !!meta.handRaised;
                } catch {
                  return false;
                }
              })();
              if (!isHand || !isHost) return undefined;
              return () => {
                // Send invite to speak message to participant
                sendData({ type: "inviteSpeak", sid: l.sid });
              };
            })()}
            onToggleRemoteMute={undefined}
            onDemote={undefined}
            roleLabel="Listener"
          />
        ))}
      </div>

      {/* Confirm leave dialog */}
      {confirmDialogOpen && (
        <ConfirmDialog
          title="Leave Room"
          subtitle="Are you sure you want to leave the room?"
          confirmLabel={isHost ? "End Space" : "Leave"}
          onCancel={() => setConfirmDialogOpen(false)}
          onConfirm={() => {
            try {
              // Gracefully disconnect from the LiveKit room before navigating away.
              if (isHost) {
                try {
                  fetch(`/api/spaces?spaceId=${room.name}`, {
                    method: "DELETE",
                  });
                } catch (e) {
                  console.error("end space api fail", e);
                }
              }
              room?.disconnect();
            } catch (err) {
              // Log error for observability, but do not expose details to the user
              // eslint-disable-next-line no-console
              console.error("Error disconnecting from room", err);
            } finally {
              // Navigate the user back to the landing page.
              router.push("/");
            }
          }}
        />
      )}

      {/* Bottom bar */}
      <BottomBar
        className="fixed bottom-0 left-0 right-0"
        isSpeaker={!isLocalMuted}
        onToggleMic={toggleMic}
        onRaiseHand={raiseHand}
        onOpenReactionPicker={() => setPickerOpen(true)}
        onTipClick={() => setPickerOpen(true)}
        likes={likes}
        handRaiseCount={0}
        isHost={isHost}
        onQueueClick={() => setQueueOpen(true)}
        onInviteClick={onInviteClick}
      />

      {pickerOpen && (
        <ReactionPicker
          onPick={(t) => handleSendReaction(t)}
          onClose={() => {
            setPickerOpen(false);
          }}
        />
      )}

      {isHost && queueOpen && (
        <HandRaiseQueue
          list={[]}
          onClose={() => setQueueOpen(false)}
          onAccept={(sid) => {
            sendData({ type: "inviteSpeak", sid });
            setQueueOpen(false);
          }}
          onReject={(sid) => {
            sendData({ type: "rejectHand", sid });
            setQueueOpen(false);
          }}
        />
      )}

      {/* Floating reactions overlay */}
      <ReactionOverlay reactions={reactions} />
    </div>
  );
}
