"use client";

import {
  LiveKitRoom,
  RoomAudioRenderer,
  useRoomContext,
} from "@livekit/components-react";
import { Participant } from "livekit-client";
import "@livekit/components-styles";
import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
// const InviteSheet = dynamic(() => import("./InviteSheet"), { ssr: false });
// const BottomBar = dynamic(() => import("./BottomBar"), { ssr: false });
const ConfirmDialog = dynamic(() => import("./ConfirmDialog"), { ssr: false });
const BottomBar = dynamic(() => import("./BottomBar"), { ssr: false });

interface AudioRoomProps {
  token: string;
  serverUrl: string;
  title?: string;
}

function Header({ title }: { title?: string }) {
  const room = useRoomContext();
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const handleLeaveClick = () => setConfirm(true);

  // share copy logic could go here if needed

  return (
    <>
      <div className="fixed top-0 left-0 w-full flex items-center justify-between bg-[var(--lk-background)]/90 backdrop-blur px-4 py-2 z-50">
        {/* left controls */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => router.push("/")}
            aria-label="Minimise"
            className="p-1 text-xl"
          >
            ▾
          </button>
          <span className="bg-red-600 text-[10px] px-1.5 py-0.5 rounded text-white mr-2">
            REC
          </span>
          <div className="flex flex-col truncate">
            <span
              className="font-semibold leading-tight truncate max-w-[50vw]"
              title={title ?? room.name}
            >
              {title ?? room.name}
            </span>
            <span className="text-[11px] text-[var(--lk-foreground-muted)] truncate">
              {room.remoteParticipants.size + 1} listening
            </span>
          </div>
        </div>

        {/* right controls */}
        <div className="flex items-center gap-3">
          <button className="text-2xl" aria-label="Options">
            •••
          </button>
          <button
            onClick={handleLeaveClick}
            className="text-sm px-2 py-1 rounded border border-red-500 text-red-500 hover:bg-red-500/20"
          >
            Leave
          </button>
        </div>
      </div>
      {confirm && (
        <ConfirmDialog
          title="End Space?"
          subtitle="This will disconnect you."
          confirmLabel="Yes, leave"
          onConfirm={() => {
            room.disconnect();
            router.push("/");
          }}
          onCancel={() => setConfirm(false)}
        />
      )}
    </>
  );
}

// Add util for avatar
function AvatarCircle({
  p,
  size = 48,
  highlight = false,
}: {
  p: Participant;
  size?: number;
  highlight?: boolean;
}) {
  const initials = p.identity.slice(0, 2).toUpperCase();
  return (
    <div
      className={`flex items-center justify-center rounded-full bg-[var(--lk-border-color)] text-sm font-semibold ${highlight ? "ring-2 ring-[var(--lk-accent)]" : ""}`}
      style={{ width: size, height: size }}
    >
      {highlight && (
        <span className="absolute -bottom-1 right-1 w-2.5 h-2.5 bg-green-500 rounded-full animate-ping" />
      )}
      <span className="relative">{initials}</span>
    </div>
  );
}

function SpacesLayout() {
  const room = useRoomContext();
  const host = room.localParticipant;
  const activeSpeakers = room.activeSpeakers;
  const remoteParticipants = Array.from(room.remoteParticipants.values());

  const speakers = remoteParticipants.filter((p) => activeSpeakers.includes(p));
  const listeners = remoteParticipants.filter(
    (p) => !activeSpeakers.includes(p),
  );

  return (
    <div className="flex flex-col items-center pt-20 pb-24 min-h-screen bg-gradient-to-b from-violet-900 via-purple-800 to-purple-900 text-white overflow-y-auto">
      {/* Host */}
      <AvatarCircle p={host as Participant} size={96} highlight />
      <p className="mt-2 font-bold flex flex-col items-center gap-[2px]">
        {host.identity}
        <span className="text-[10px] bg-purple-700/60 px-1 rounded">Host</span>
      </p>

      {/* Speakers */}
      {speakers.length > 0 && (
        <div className="mt-8 w-full overflow-x-auto flex gap-4 px-6">
          {speakers.map((s) => (
            <div key={s.identity} className="flex flex-col items-center">
              <AvatarCircle p={s as Participant} size={64} highlight />
              <span className="text-xs mt-1 truncate w-16 text-center flex flex-col items-center">
                {s.identity}
                <span className="text-[9px] text-pink-300">Speaker</span>
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Listeners */}
      {listeners.length > 0 && (
        <div className="mt-10 grid grid-cols-4 gap-4 px-6 w-full max-w-lg">
          {listeners.map((l) => (
            <div key={l.identity} className="flex flex-col items-center">
              <AvatarCircle p={l as Participant} size={48} />
              <span className="text-[10px] mt-1 truncate w-12 text-center flex flex-col items-center">
                {l.identity}
                <span className="text-[8px] text-gray-400">Listener</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * AudioRoom renders the LiveKit UI and connects the user to the provided room.
 * SECURITY: The token is generated server-side and passed as a prop. Do not
 * expose your LiveKit API key/secret on the client.
 */
export default function AudioRoom({ token, serverUrl, title }: AudioRoomProps) {
  // const [inviteOpen, setInviteOpen] = useState(false);
  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      data-lk-theme="default"
      connectOptions={{ autoSubscribe: true }}
      style={{ height: "100vh", width: "100%" }}
    >
      <Header title={title} />
      <SpacesLayout />
      {/* {inviteOpen && <InviteSheet onClose={() => setInviteOpen(false)} />} */}
      <RoomAudioRenderer />
      <BottomBar onInvite={() => {}} />
    </LiveKitRoom>
  );
}
