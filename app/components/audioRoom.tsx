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
const InviteSheet = dynamic(() => import("./InviteSheet"), { ssr: false });
const BottomBar = dynamic(() => import("./BottomBar"), { ssr: false });
const ConfirmDialog = dynamic(() => import("./ConfirmDialog"), { ssr: false });

interface AudioRoomProps {
  token: string;
  serverUrl: string;
  title?: string;
}

function Header({ title }: { title?: string }) {
  const room = useRoomContext();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const handleLeaveClick = () => setConfirm(true);

  const roomUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(roomUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <>
      <div className="fixed top-0 left-0 w-full flex items-center justify-between bg-[var(--lk-background)]/80 backdrop-blur shadow px-4 py-2 z-50">
        <div className="flex items-center gap-2 truncate">
          <span className="font-semibold">{title ?? "Space"}</span>
          <span className="truncate max-w-[40vw]" title={room.name}>
            {room.name}
          </span>
          <span className="text-xs text-[var(--lk-foreground-muted)]">
            · {room.remoteParticipants.size + 1} listeners
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCopy}
            className="text-sm px-2 py-1 rounded bg-[var(--lk-accent)] text-white hover:opacity-90"
          >
            {copied ? "Copied!" : "Copy Link"}
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
      {initials}
    </div>
  );
}

function SpacesLayout() {
  const room = useRoomContext();
  const host = room.localParticipant;
  const speakers = room.activeSpeakers.filter((p) => p !== host);
  const listeners = Array.from(room.remoteParticipants.values()).filter(
    (p) => !speakers.includes(p),
  );

  return (
    <div className="flex flex-col items-center pt-20 pb-24 min-h-screen bg-gradient-to-b from-violet-900 via-purple-800 to-purple-900 text-white overflow-y-auto">
      {/* Host */}
      <AvatarCircle p={host as unknown as Participant} size={96} highlight />
      <p className="mt-2 font-bold">{host.identity}</p>

      {/* Speakers */}
      {speakers.length > 0 && (
        <div className="mt-8 w-full overflow-x-auto flex gap-4 px-6">
          {speakers.map((s) => (
            <div key={s.identity} className="flex flex-col items-center">
              <AvatarCircle
                p={s as Participant}
                size={64}
                highlight={room.activeSpeakers.includes(s)}
              />
              <span className="text-xs mt-1 truncate w-16 text-center">
                {s.identity}
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
              <span className="text-[10px] mt-1 truncate w-12 text-center">
                {l.identity}
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
  const [inviteOpen, setInviteOpen] = useState(false);
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
      {inviteOpen && <InviteSheet onClose={() => setInviteOpen(false)} />}
      <RoomAudioRenderer />
      <BottomBar onInvite={() => setInviteOpen(true)} />
    </LiveKitRoom>
  );
}
