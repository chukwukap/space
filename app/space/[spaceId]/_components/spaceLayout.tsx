"use client";

import { useLeaveRoom } from "@/app/hooks/useLeaveRoom";
import { useTipReaction } from "@/app/hooks/useTipReaction";
import { useUser } from "@/app/providers/userProvider";
import { ReactionType, Role } from "@/lib/generated/prisma";
import { ParticipantMetadata, SpaceWithHostParticipant } from "@/lib/types";
import {
  GridLayout,
  ParticipantAudioTile,
  useLocalParticipant,
  useRemoteParticipants,
  useRoomContext,
  useTracks,
  ConnectionStateToast,
} from "@livekit/components-react";
import { Participant, RoomEvent, Track } from "livekit-client";
import { useRouter } from "next/navigation";
import { useState, useCallback, useEffect } from "react";
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
  const { localParticipant } = useLocalParticipant();

  const remoteParticipants = useRemoteParticipants({});
  const host = room.getParticipantByIdentity(space.hostId.toString());
  const tracks = useTracks(
    [{ source: Track.Source.Microphone, withPlaceholder: true }],
    { onlySubscribed: false },
  );
  const chainId = useChainId();

  const [reactions, setReactions] = useState<
    Array<{ id: number; left: number; emoji: string }>
  >([]);

  // Reaction picker open state
  const [pickerOpen, setPickerOpen] = useState(false);

  const [tipModalOpen, setTipModalOpen] = useState(false);
  // Helper – send data messages (move above hooks)
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
  });

  // Host participant

  // Listeners are remote participants who are not currently speaking
  const listeners = remoteParticipants.filter(
    (p) => !room.activeSpeakers.includes(p),
  );

  // Host: accept hand-raise (invite to speak)

  const toggleMic = useCallback(() => {
    if (room.localParticipant) {
      room.localParticipant.setMicrophoneEnabled(
        !room.localParticipant.isMicrophoneEnabled,
      );
    }
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
  if (space.status === "ENDED") {
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
      <ConnectionStateToast room={room} />

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
        {space.title || "Untitled Space"}
      </h1>

      {/* Avatars for host, speakers, and listeners */}
      <GridLayout
        tracks={tracks}
        style={{ height: "calc(100vh - var(--lk-control-bar-height))" }}
      >
        <ParticipantAudioTile />
      </GridLayout>

      {/* Avatars for host, speakers, and listeners */}
      <div className="flex px-6 py-4 gap-4 flex-1">
        {/* Host */}
        {host && <ParticipantWidget p={host} roleLabel={Role.HOST} />}
        {/* Speakers */}
        {room.activeSpeakers.map((s) => (
          <ParticipantWidget key={s.identity} p={s} roleLabel={Role.SPEAKER} />
        ))}
        {/* Listeners */}
        {listeners.map((l: Participant) => (
          <ParticipantWidget key={l.identity} p={l} roleLabel={Role.LISTENER} />
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
        onOpenReactionPicker={() => setPickerOpen(true)}
        onInviteClick={onInviteClick}
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
