"use client";

import {
  LiveKitRoom,
  RoomAudioRenderer,
  useParticipants,
  useRoomContext,
  useToken,
} from "@livekit/components-react";

// Icons
import {
  Mic2 as MicIcon,
  HandMetal as HandIcon,
  Heart as HeartIcon,
  Users as UsersIcon,
  Share2 as ShareIcon,
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { Participant as LKParticipant, RoomEvent } from "livekit-client";
import "@livekit/components-styles";
import dynamic from "next/dynamic";
import { AvatarWithControls } from "./avatar";
import { useUser } from "@/app/providers/userProvider";
import { useRouter } from "next/navigation";
import { useSpaceStore } from "./spaceStore";

const InviteSheet = dynamic(() => import("./inviteSheet"), { ssr: false });
const ConfirmDialog = dynamic(() => import("./confirmDialog"), { ssr: false });

interface SpaceRoomProps {
  serverUrl: string;
  title?: string;
  spaceId: string;
}

/**
 * SpaceLayout displays the current state of the room, including host, speakers, and listeners.
 * It also provides a leave button that disconnects the user securely and navigates home.
 */
function SpaceLayout({ title }: { title?: string }) {
  const room = useRoomContext();
  const spaceStore = useSpaceStore();
  const participants = useParticipants();
  console.log("participants", participants[0]);
  const router = useRouter();
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  // Host hand-raise queue panel state
  const [queueOpen, setQueueOpen] = useState(false);

  const getParticipantBySid = (sid: string | null) => {
    if (!sid) return undefined;
    if (room.localParticipant.sid === sid) return room.localParticipant;
    return room.remoteParticipants.get(sid);
  };

  const host = getParticipantBySid(spaceStore.hostSid) ?? room.localParticipant;
  // Active speakers are those currently speaking
  const activeSpeakers = room.activeSpeakers;
  // All remote participants in the room
  const remoteParticipants = Array.from(room.remoteParticipants.values());

  const speakers = [...spaceStore.speakers.values()];
  // Listeners are remote participants who are not currently speaking
  const listeners = remoteParticipants.filter(
    (p) => !activeSpeakers.includes(p),
  );

  // Determine if local participant is host (fallback to first participant)
  const isHost = host?.identity === participants[0]?.identity;

  const handRaiseList = [...spaceStore.handQueue.values()];

  const handRaisedCount = handRaiseList.length;

  /* Participant count */
  const participantCount = room.remoteParticipants.size + 1; // + local

  /** ------------------------------------------------------------------
   * Helper – send data messages
   * ----------------------------------------------------------------- */
  const sendData = useCallback(
    (message: Record<string, unknown>) => {
      try {
        room.localParticipant.publishData(
          new TextEncoder().encode(JSON.stringify(message)),
          { reliable: true },
        );
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("[LiveKit] Failed to publish data", err);
      }
    },
    [room],
  );

  /** ------------------------------------------------------------------
   * Local state helpers
   * ----------------------------------------------------------------- */
  const isLocalMuted = room.localParticipant.isMicrophoneEnabled === false;

  /* Rerender on active speaker change */
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const cb = () => forceUpdate((c) => c + 1);
    room.on(RoomEvent.ActiveSpeakersChanged, cb);
    return () => {
      room.off(RoomEvent.ActiveSpeakersChanged, cb);
    };
  }, [room]);

  useEffect(() => {
    // initialize recording flag from room metadata
    try {
      const meta = room.metadata ? JSON.parse(room.metadata) : {};
      spaceStore.setRecording(!!meta.recording);
    } catch {}

    // set initial host
    spaceStore.setHost(room.localParticipant.sid);

    const handleParticipantConnected = (p: LKParticipant) => {
      // Speaker if has publish permission (mic enabled)
      if (p.isMicrophoneEnabled) spaceStore.addSpeaker(p);
    };
    const handleParticipantDisconnected = (p: LKParticipant) => {
      spaceStore.removeSpeaker(p.sid);
      spaceStore.dequeueHand(p.sid);
      if (spaceStore.hostSid === p.sid) {
        // promote first speaker or first participant
        const next =
          [...spaceStore.speakers.keys()][0] ||
          room.remoteParticipants.keys().next().value;
        spaceStore.setHost(next ?? room.localParticipant.sid);
      }
    };
    const handleMetadataChanged = (p: LKParticipant) => {
      try {
        const meta = p.metadata ? JSON.parse(p.metadata) : {};
        if (meta.handRaised) spaceStore.enqueueHand(p);
        else spaceStore.dequeueHand(p.sid);
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
  }, [room]);

  const toggleMic = useCallback(() => {
    room.localParticipant.setMicrophoneEnabled(!isLocalMuted);
  }, [room, isLocalMuted]);

  const raiseHand = useCallback(() => {
    try {
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
  const [hearts, setHearts] = useState<Array<{ id: number; left: number }>>([]);

  /* Connection state banner */
  const [networkState, setNetworkState] = useState<string | null>(null);

  useEffect(() => {
    const onStateChanged = () => {
      const state = room.state;
      if (state !== "connected") {
        setNetworkState(state);
      } else {
        setNetworkState(null);
      }
    };
    onStateChanged();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (room as any).on("stateChanged", onStateChanged);
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (room as any).off("stateChanged", onStateChanged);
    };
  }, [room]);

  // Trigger heart burst when likes increases
  useEffect(() => {
    if (!likes) return;
    const id = Date.now();
    setHearts((prev) => [
      ...prev,
      { id, left: Math.random() * 80 + 10 }, // random horizontal position
    ]);
    const timer = setTimeout(() => {
      setHearts((prev) => prev.filter((h) => h.id !== id));
    }, 3000);
    return () => clearTimeout(timer);
  }, [likes]);

  useEffect(() => {
    const handleData = (payload: Uint8Array) => {
      try {
        const msg = JSON.parse(new TextDecoder().decode(payload));
        switch (msg.type) {
          case "inviteSpeak":
            // Listener granted permission to speak -> unmute if the message is for us
            if (msg.sid === room.localParticipant.sid) {
              room.localParticipant.setMicrophoneEnabled(true);
            }
            break;
          case "reaction":
            setLikes((c) => c + 1);
            break;
          case "muteRequest":
            if (msg.sid === room.localParticipant.sid) {
              room.localParticipant.setMicrophoneEnabled(false);
            }
            break;
          case "demoteSpeaker":
            if (msg.sid === room.localParticipant.sid) {
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
      } catch {}
    };

    room.on("dataReceived", handleData);
    return () => {
      room.off("dataReceived", handleData);
    };
  }, [room]);

  return (
    <div className="gap-4 min-h-screen bg-gray-950">
      {/* Network banner */}
      {networkState && (
        <div className="fixed top-0 left-0 w-full bg-yellow-600 text-center text-sm py-1 z-50">
          {networkState === "reconnecting"
            ? "Reconnecting…"
            : networkState === "disconnected"
              ? "Disconnected. Rejoining…"
              : networkState}
        </div>
      )}

      <header className="flex justify-between px-4 py-2 bg-black/80 backdrop-blur z-40">
        <div className="flex items-center gap-3">
          {recordingBadge}
          <span className="text-xs text-gray-300">
            {participantCount} · listeners
          </span>
          <button className="text-2xl" aria-label="More options">
            •••
          </button>
        </div>
        <button
          className="text-red-500 font-semibold"
          onClick={() => setConfirmDialogOpen(true)}
        >
          Leave
        </button>
      </header>

      {/* Room Title */}
      <h1
        className="px-6 text-lg font-bold leading-snug mt-4"
        data-testid="space-title"
      >
        {title || "Untitled Space"}
      </h1>

      {/* Avatars for host, speakers, and listeners */}
      <div className="flex px-6 py-4 gap-4">
        {/* Host */}
        <AvatarWithControls
          p={host as LKParticipant}
          size={56}
          isSpeaking={host.isSpeaking}
          isHost
          remoteMuted={!host.isMicrophoneEnabled}
        />
        {/* Speakers */}
        {speakers.map((s) => (
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
          />
        ))}
      </div>

      {/* Confirm leave dialog */}
      {confirmDialogOpen && (
        <ConfirmDialog
          title="Leave Room"
          subtitle="Are you sure you want to leave the room?"
          confirmLabel="Leave"
          onCancel={() => setConfirmDialogOpen(false)}
          onConfirm={() => {
            try {
              // Gracefully disconnect from the LiveKit room before navigating away.
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
        isSpeaker={!isLocalMuted}
        onToggleMic={toggleMic}
        onRaiseHand={raiseHand}
        onReaction={() => sendData({ type: "reaction" })}
        likes={likes}
        handRaiseCount={handRaisedCount}
        isHost={isHost}
        onQueueClick={() => setQueueOpen(true)}
      />

      {/* Host hand raise queue panel */}
      {isHost && queueOpen && (
        <HandRaiseQueue
          list={handRaiseList}
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

      {/* Floating hearts overlay */}
      <ReactionOverlay hearts={hearts} />
    </div>
  );
}

/* Hand raise queue component */
function HandRaiseQueue({
  list,
  onClose,
  onAccept,
  onReject,
}: {
  list: LKParticipant[];
  onClose: () => void;
  onAccept: (sid: string) => void;
  onReject: (sid: string) => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-800 w-80 rounded-lg p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold">Hand Raise Queue</h3>
          <button onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        {list.length === 0 ? (
          <p className="text-sm text-gray-400">No requests</p>
        ) : (
          <ul className="space-y-2 max-h-60 overflow-y-auto">
            {list.map((p) => (
              <li key={p.sid} className="flex items-center justify-between">
                <span>{p.identity}</span>
                <div className="flex gap-2">
                  <button
                    className="px-2 py-0.5 bg-violet-600 rounded text-sm"
                    onClick={() => onAccept(p.sid)}
                  >
                    Invite
                  </button>
                  <button
                    className="px-2 py-0.5 bg-gray-600 rounded text-sm"
                    onClick={() => onReject(p.sid)}
                  >
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ReactionOverlay({
  hearts,
}: {
  hearts: Array<{ id: number; left: number }>;
}) {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-40">
      {hearts.map((h) => (
        <span
          key={h.id}
          style={{ left: `${h.left}%` }}
          className="absolute bottom-10 text-pink-500 animate-heart-burst"
        >
          ❤
        </span>
      ))}
      {/* Tailwind keyframes via arbitrary value */}
      <style jsx>{`
        @keyframes heart-burst {
          0% {
            transform: translateY(0) scale(0.8);
            opacity: 0.9;
          }
          100% {
            transform: translateY(-200px) scale(1.4);
            opacity: 0;
          }
        }
        .animate-heart-burst {
          animation: heart-burst 2.5s ease-in forwards;
        }
      `}</style>
    </div>
  );
}

/**
 * SpaceRoom connects the user to the LiveKit room and renders the room UI.
 * SECURITY: The token is generated server-side and passed as a prop. Never expose API secrets on the client.
 */
export default function SpaceRoom({
  serverUrl,
  spaceId,
  title,
}: SpaceRoomProps) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const user = useUser();

  // Generate a secure access token for the user to join the room.
  // The token endpoint is server-side and never exposes secrets.
  const token = useToken(
    process.env.NEXT_PUBLIC_LK_TOKEN_ENDPOINT || "/api/livekit/token",
    spaceId,
    {
      userInfo: {
        identity: user?.user?.id?.toString() ?? "testIdentity",
        name: user?.user?.username ?? "testUserName",
      },
    },
  );

  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      data-lk-theme="default"
      connectOptions={{ autoSubscribe: true }}
      options={{
        audioCaptureDefaults: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 2,
          sampleRate: 48000,
          sampleSize: 16,
          latency: 100,
        },
      }}
      style={{ height: "100vh", width: "100%" }}
      video={false}
      audio={false}
    >
      {/* Pass the title down so the correct space title is shown */}
      <SpaceLayout title={title} />
      {inviteOpen && <InviteSheet onClose={() => setInviteOpen(false)} />}
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}

/** ----------------------------------------------------------------------
 * Bottom Bar component
 * ------------------------------------------------------------------- */
interface BottomBarProps {
  isSpeaker: boolean;
  onToggleMic: () => void;
  onRaiseHand: () => void;
  onReaction: () => void;
  likes: number;
  handRaiseCount: number;
  isHost: boolean;
  onQueueClick: () => void;
}

function BottomBar({
  isSpeaker,
  onToggleMic,
  onRaiseHand,
  onReaction,
  likes,
  handRaiseCount,
  isHost,
  onQueueClick,
}: BottomBarProps) {
  return (
    <footer className="fixed bottom-0 left-0 w-full bg-black/60 backdrop-blur flex justify-around items-center px-4 py-3 z-50">
      {isSpeaker ? (
        <BarButton label="Mic" icon={MicIcon} onClick={onToggleMic} />
      ) : (
        <BarButton label="Request" icon={HandIcon} onClick={onRaiseHand} />
      )}
      <BarButton label={String(likes)} icon={HeartIcon} onClick={onReaction} />
      {isHost && handRaiseCount > 0 && (
        <BarButton
          label={`Queue(${handRaiseCount})`}
          icon={HandIcon}
          onClick={onQueueClick}
        />
      )}
      <BarButton
        label="Share"
        icon={ShareIcon}
        onClick={() => {
          try {
            navigator.clipboard.writeText(window.location.href);
          } catch {}
        }}
      />
      <BarButton label="Invite" icon={UsersIcon} onClick={() => {}} />
    </footer>
  );
}

/** BarButton component – extracted for reuse */
interface BarButtonProps {
  label: string;
  icon: typeof MicIcon;
  onClick: () => void;
  danger?: boolean;
}

function BarButton({ label, icon: IconCmp, onClick, danger }: BarButtonProps) {
  return (
    <button
      className={`flex flex-col items-center text-white hover:opacity-90 ${
        danger ? "text-red-500" : ""
      }`}
      onClick={onClick}
    >
      <IconCmp className="w-6 h-6" />
      <span className="text-[10px] mt-1">{label}</span>
    </button>
  );
}
