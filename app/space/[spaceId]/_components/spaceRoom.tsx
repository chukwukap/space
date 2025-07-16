"use client";

import {
  LiveKitRoom,
  RoomAudioRenderer,
  useParticipants,
  useRoomContext,
  useToken,
} from "@livekit/components-react";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  ConnectionState,
  Participant as LKParticipant,
  RoomEvent,
} from "livekit-client";
import "@livekit/components-styles";
import dynamic from "next/dynamic";
import { AvatarWithControls } from "./avatar";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react"; // icon for minimize
import { useUser } from "@/app/providers/userProvider";
import { useSpaceStore } from "./spaceStore";
import ReactionOverlay from "./ReactionOverlay";
import BottomBar from "./bottomBar";
import HandRaiseQueue from "./HandRaiseQueue";
import ReactionPicker, { ReactionType } from "./ReactionPicker";
import MobileHeader from "@/app/_components/mobileHeader";
import { Address, Hex, parseUnits } from "viem";
import { USDC_ADDRESS, USDC_DECIMALS } from "@/lib/constants";
import {
  useAccount,
  useChainId,
  useConnect,
  useConnectors,
  useSignTypedData,
} from "wagmi";
import { spendPermissionManagerAddress } from "@/lib/abi/SpendPermissionManager";

// Use the new reusable drawer component instead of the previous custom sheet.
const InviteDrawer = dynamic(() => import("@/app/_components/inviteDrawer"), {
  ssr: false,
});

// Compact overlay shown when the host minimises the main Space UI.
const MiniSpaceSheet = dynamic(
  () => import("@/app/_components/miniSpaceSheet"),
  {
    ssr: false,
  },
);

const ConfirmDialog = dynamic(() => import("./confirmDialog"), { ssr: false });

interface SpaceRoomProps {
  serverUrl: string;
  spaceId: string;
}

/**
 * SpaceLayout displays the current state of the room, including host, speakers, and listeners.
 * It also provides a leave button that disconnects the user securely and navigates home.
 */
function SpaceLayout({
  spaceId,
  onMinimize,
  onInviteClick,
}: {
  spaceId: string;
  onMinimize: () => void;
  onInviteClick: () => void;
}) {
  const room = useRoomContext();
  const spaceStore = useSpaceStore();
  const participants = useParticipants();
  console.log("participants", participants[0]);
  const router = useRouter();
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  // Host hand-raise queue panel state
  const [queueOpen, setQueueOpen] = useState(false);
  const account = useAccount();
  const chainId = useChainId();
  const { connectAsync } = useConnect();
  const connectors = useConnectors();
  const { signTypedDataAsync } = useSignTypedData();
  const { user } = useUser();

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

    const handleMetadataChanged = (
      _meta: string | undefined,
      p: LKParticipant,
    ) => {
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
  const [reactions, setReactions] = useState<
    Array<{ id: number; left: number; emoji: string }>
  >([]);

  const reactionEmojis: Record<ReactionType, string> = {
    heart: "❤️",
    clap: "👏",
    fire: "🔥",
    lol: "😂",
    hundred: "💯",
  };

  const reactionTipWei: Record<ReactionType, string> = {
    heart:
      typeof window !== "undefined"
        ? (JSON.parse(localStorage.getItem("tipAmounts") || "{}").heart ?? "1")
        : "1",
    clap:
      typeof window !== "undefined"
        ? (JSON.parse(localStorage.getItem("tipAmounts") || "{}").clap ?? "2")
        : "2",
    fire:
      typeof window !== "undefined"
        ? (JSON.parse(localStorage.getItem("tipAmounts") || "{}").fire ?? "5")
        : "5",
    lol:
      typeof window !== "undefined"
        ? (JSON.parse(localStorage.getItem("tipAmounts") || "{}").lol ?? "3")
        : "3",
    hundred:
      typeof window !== "undefined"
        ? (JSON.parse(localStorage.getItem("tipAmounts") || "{}").hundred ??
          "10")
        : "10",
  };

  /* Connection state banner */
  const [networkState, setNetworkState] = useState<string | null>(null);

  /* ------------------ Recording badge ------------------ */
  const recordingBadge = spaceStore.recording ? (
    <span className="bg-red-600 animate-pulse rounded px-1.5 py-0.5 text-[10px] font-semibold">
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
            if (msg.reactionType) {
              const emoji = reactionEmojis[msg.reactionType as ReactionType];
              if (emoji) addFloatingReaction(emoji);
            }
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

    room.on(RoomEvent.DataReceived, handleData);
    return () => {
      room.off(RoomEvent.DataReceived, handleData);
    };
  }, [room]);

  /** ----------------------------------------- */
  /* Reaction handling with tip                */
  /** ----------------------------------------- */
  const [pickerOpen, setPickerOpen] = useState(false);
  /** Currently selected participant to tip (host or speaker). */
  const [tipRecipient, setTipRecipient] = useState<LKParticipant | null>(null);

  const handleSendReaction = async (type: ReactionType) => {
    // optimistic display
    addFloatingReaction(reactionEmojis[type]);
    setLikes((c) => c + 1);
    sendData({ type: "reaction", reactionType: type });

    try {
      let addr = account.address as Address | undefined;
      if (!addr) {
        const res = await connectAsync({ connector: connectors[0] });
        addr = res.accounts[0] as Address;
      }
      if (!addr) return;

      const allowanceUnits = reactionTipWei[type];

      const spendPerm = {
        account: addr,
        spender: process.env.NEXT_PUBLIC_SPENDER_ADDRESS as Address,
        token: USDC_ADDRESS,
        allowance: parseUnits(allowanceUnits, USDC_DECIMALS),
        period: 86_400,
        start: 0,
        end: 281_474_976_710_655,
        salt: BigInt(Date.now()),
        extraData: "0x" as Hex,
      } as const;

      const signature = (await signTypedDataAsync({
        domain: {
          name: "Spend Permission Manager",
          version: "1",
          chainId,
          verifyingContract: spendPermissionManagerAddress,
        },
        types: {
          SpendPermission: [
            { name: "account", type: "address" },
            { name: "spender", type: "address" },
            { name: "token", type: "address" },
            { name: "allowance", type: "uint160" },
            { name: "period", type: "uint48" },
            { name: "start", type: "uint48" },
            { name: "end", type: "uint48" },
            { name: "salt", type: "uint256" },
            { name: "extraData", type: "bytes" },
          ],
        },
        primaryType: "SpendPermission",
        message: spendPerm,
      })) as Hex;

      const replacer = (k: string, v: unknown) =>
        typeof v === "bigint" ? v.toString() : v;

      const fromId = user?.id ?? null;
      const toId = tipRecipient ? parseInt(tipRecipient.identity) : null;

      await fetch("/api/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          {
            spendPermission: spendPerm,
            signature,
            amount: allowanceUnits,
            decimals: USDC_DECIMALS,
            spaceId,
            fromId,
            toId,
          },
          replacer,
        ),
      });

      /* Persist reaction and tip for analytics */
      if (fromId && toId) {
        try {
          const reactionRes = await fetch("/api/reactions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              spaceId,
              userId: fromId,
              type,
            }),
          });
          const reaction = await reactionRes.json();

          await fetch("/api/tips", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              spaceId,
              fromId,
              toId,
              amount: allowanceUnits,
              tokenSymbol: "USDC",
              txHash: "pending", // will be updated server-side
              reactionId: reaction.id,
            }),
          });
        } catch (err) {
          console.error("[tip persist] failed", err);
        }
      }
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

  return (
    <div className="gap-4 min-h-screen bg-background text-foreground">
      {/* Network banner */}
      {networkState && (
        <div className="w-full bg-yellow-600 text-center text-sm py-1 z-50">
          {networkState === "reconnecting"
            ? "Reconnecting…"
            : networkState === "disconnected"
              ? "Disconnected. Rejoining…"
              : networkState}
        </div>
      )}

      <header className="flex justify-between px-4 py-2 bg-card/80 backdrop-blur z-40">
        <div className="flex items-center gap-3">
          {recordingBadge}
          <span className="text-xs text-muted-foreground">
            {participantCount} · listeners
          </span>
          <button
            className="text-foreground/70 hover:text-foreground transition-colors"
            aria-label="Minimise Space"
            onClick={onMinimize}
          >
            <ChevronDown className="w-5 h-5" />
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
        {/* {title || "Untitled Space"} */}
      </h1>

      {/* Avatars for host, speakers, and listeners */}
      <div className="flex px-6 py-4 gap-4 flex-1">
        {/* Host */}
        <AvatarWithControls
          p={host as LKParticipant}
          size={56}
          isSpeaking={host.isSpeaking}
          isHost
          remoteMuted={!host.isMicrophoneEnabled}
          roleLabel="Host"
          onTip={() => {
            setTipRecipient(host as LKParticipant);
            setPickerOpen(true);
          }}
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
            roleLabel="Speaker"
            onTip={() => {
              setTipRecipient(s as LKParticipant);
              setPickerOpen(true);
            }}
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
            roleLabel="Listener"
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
        className="fixed bottom-0 left-0 right-0"
        isSpeaker={!isLocalMuted}
        onToggleMic={toggleMic}
        onRaiseHand={raiseHand}
        onOpenReactionPicker={() => setPickerOpen(true)}
        likes={likes}
        handRaiseCount={handRaisedCount}
        isHost={isHost}
        onQueueClick={() => setQueueOpen(true)}
        onInviteClick={onInviteClick}
      />

      {pickerOpen && (
        <ReactionPicker
          onPick={(t) => handleSendReaction(t)}
          onClose={() => {
            setPickerOpen(false);
            setTipRecipient(null);
          }}
        />
      )}

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

      {/* Floating reactions overlay */}
      <ReactionOverlay reactions={reactions} />
    </div>
  );
}

// Removed inline component definitions; now imported modular versions.

/**
 * SpaceRoom connects the user to the LiveKit room and renders the room UI.
 * SECURITY: The token is generated server-side and passed as a prop. Never expose API secrets on the client.
 */
export default function SpaceRoom({ serverUrl, spaceId }: SpaceRoomProps) {
  const params = useSearchParams();
  const roomToken = useToken("space", spaceId);
  const title = params.get("title") || "Space";
  const [inviteOpen, setInviteOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const user = useUser();
  const router = useRouter();

  return (
    <>
      <MobileHeader showBack title={decodeURIComponent(title)} />
      <LiveKitRoom
        token={roomToken}
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
        {minimized ? (
          <MiniSpaceSheet
            onClose={() => setMinimized(false)}
            onEnd={() => {
              try {
                // TODO: gracefully disconnect; for now redirect to home
                router.push("/");
              } catch {
                router.push("/");
              }
            }}
            host={{
              name: user?.user?.username ?? "You",
              avatarUrl: "/icon.png",
              verified: true,
            }}
            listeners={0}
          />
        ) : (
          <SpaceLayout
            spaceId={spaceId}
            onMinimize={() => setMinimized(true)}
            onInviteClick={() => setInviteOpen(true)}
          />
        )}

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
