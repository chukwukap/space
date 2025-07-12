import { useParticipants, useRoomContext } from "@livekit/components-react";
import { Participant as LKParticipant, RoomEvent } from "livekit-client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSpaceStore } from "./spaceStore";
import HandRaiseQueue from "./HandRaiseQueue";
import ReactionOverlay from "./ReactionOverlay";
import BottomBar from "./bottomBar";
import { AvatarWithControls } from "./avatar";

interface Props {
  title?: string;
}

export default function SpaceLayout({ title }: Props) {
  const room = useRoomContext();
  const spaceStore = useSpaceStore();
  const participants = useParticipants();
  const router = useRouter();
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);

  // Helper to fetch participant by sid across local/remote
  const getBySid = (sid: string | null | undefined) => {
    if (!sid) return undefined;
    if (room.localParticipant.sid === sid) return room.localParticipant;
    return room.remoteParticipants.get(sid);
  };

  const host = getBySid(spaceStore.hostSid) ?? room.localParticipant;
  const remoteParticipants = Array.from(room.remoteParticipants.values());
  const speakers = [...spaceStore.speakers.values()];
  const listeners = remoteParticipants.filter((p) => !speakers.includes(p));
  const handRaiseList = [...spaceStore.handQueue.values()];

  const participantCount = room.remoteParticipants.size + 1;

  /* --- Messaging helper --- */
  const sendData = useCallback(
    (msg: Record<string, unknown>) => {
      try {
        room.localParticipant.publishData(
          new TextEncoder().encode(JSON.stringify(msg)),
          { reliable: true },
        );
      } catch (err) {
        console.error("publishData failed", err);
      }
    },
    [room],
  );

  /* --- Active speaker re-render --- */
  const [, force] = useState(0);
  useEffect(() => {
    const cb = () => force((c) => c + 1);
    room.on(RoomEvent.ActiveSpeakersChanged, cb);
    return () => room.off(RoomEvent.ActiveSpeakersChanged, cb);
  }, [room]);

  /* --- Participant / metadata events -> store --- */
  useEffect(() => {
    spaceStore.setHost(room.localParticipant.sid);
    const onConnect = (p: LKParticipant) => {
      if (p.isMicrophoneEnabled) spaceStore.addSpeaker(p);
    };
    const onDisc = (p: LKParticipant) => {
      spaceStore.removeSpeaker(p.sid);
      spaceStore.dequeueHand(p.sid);
    };
    const onMeta = (_meta: string | undefined, p: LKParticipant) => {
      try {
        const meta = p.metadata ? JSON.parse(p.metadata) : {};
        if (meta.handRaised) spaceStore.enqueueHand(p);
        else spaceStore.dequeueHand(p.sid);
      } catch {}
    };
    room.on(RoomEvent.ParticipantConnected, onConnect);
    room.on(RoomEvent.ParticipantDisconnected, onDisc);
    room.on(RoomEvent.ParticipantMetadataChanged, onMeta as any);
    return () => {
      room.off(RoomEvent.ParticipantConnected, onConnect);
      room.off(RoomEvent.ParticipantDisconnected, onDisc);
      room.off(RoomEvent.ParticipantMetadataChanged, onMeta as any);
    };
  }, [room]);

  /* --- Likes / reactions --- */
  const [likes, setLikes] = useState(0);
  const [hearts, setHearts] = useState<Array<{ id: number; left: number }>>([]);
  useEffect(() => {
    if (!likes) return;
    const id = Date.now();
    setHearts((h) => [...h, { id, left: Math.random() * 80 + 10 }]);
    const t = setTimeout(
      () => setHearts((h) => h.filter((v) => v.id !== id)),
      3000,
    );
    return () => clearTimeout(t);
  }, [likes]);

  /* --- Header recording badge --- */
  const RecordingBadge = spaceStore.recording ? (
    <span className="bg-red-600 animate-pulse rounded px-1.5 py-0.5 text-[10px] font-semibold">
      REC
    </span>
  ) : null;

  return (
    <div className="gap-4 min-h-screen bg-gray-950">
      {/* Header */}
      <header className="flex justify-between px-4 py-2 bg-black/80 backdrop-blur z-40">
        <div className="flex items-center gap-3">
          {RecordingBadge}
          <span className="text-xs text-gray-300">
            {participantCount} · listeners
          </span>
        </div>
        <button
          className="text-red-500 font-semibold"
          onClick={() => setConfirmDialogOpen(true)}
        >
          Leave
        </button>
      </header>

      {/* Title */}
      <h1 className="px-6 text-lg font-bold leading-snug mt-4">
        {title || "Untitled Space"}
      </h1>

      {/* Participants */}
      <div className="flex px-6 py-4 gap-4 flex-wrap">
        <AvatarWithControls
          p={host}
          size={56}
          isHost
          isSpeaking={host.isSpeaking}
          remoteMuted={!host.isMicrophoneEnabled}
        />
        {speakers.map((s) => (
          <AvatarWithControls
            key={s.sid}
            p={s}
            size={56}
            isSpeaking={s.isSpeaking}
            remoteMuted={!s.isMicrophoneEnabled}
          />
        ))}
      </div>

      {/* Bottom bar */}
      <BottomBar
        isSpeaker={!room.localParticipant.isMicrophoneEnabled === false}
        onToggleMic={() =>
          room.localParticipant.setMicrophoneEnabled(
            !room.localParticipant.isMicrophoneEnabled,
          )
        }
        onRaiseHand={() =>
          sendData({ type: "handRaised", sid: room.localParticipant.sid })
        }
        onReaction={() => sendData({ type: "reaction" })}
        likes={likes}
        handRaiseCount={handRaiseList.length}
        isHost={true}
        onQueueClick={() => setQueueOpen(true)}
      />

      {/* Modals & overlays */}
      {queueOpen && (
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

      <ReactionOverlay hearts={hearts} />
    </div>
  );
}
