"use client";

import { useState } from "react";
import { Icon } from "./DemoComponents";

/** ----------------------------------------------------------------------
 * Types & sample data
 * ------------------------------------------------------------------- */
export type Role = "host" | "cohost" | "speaker" | "listener";

export interface Participant {
  id: string;
  name: string;
  avatarUrl?: string;
  role: Role;
  muted?: boolean;
  verified?: boolean;
}

// Temporary hard-coded list purely for layout development. ⚠️
// Replace with real data from LiveKit / Farcaster later.
const SAMPLE_PARTICIPANTS: Participant[] = [
  { id: "1", name: "Wen A…", role: "host", verified: true },
  { id: "2", name: "Justin Ro…", role: "cohost", verified: true },
  { id: "3", name: "SOLA…", role: "speaker", verified: true },
  { id: "4", name: "Clem C…", role: "speaker", verified: true },
  { id: "5", name: "Marky…", role: "speaker", muted: true, verified: true },
  { id: "6", name: "BOG", role: "speaker", verified: true },
  { id: "7", name: "Buil…", role: "speaker", verified: true },
  { id: "8", name: "Mitche…", role: "speaker", verified: true },
  { id: "9", name: "Rajath", role: "speaker", muted: true },
  { id: "10", name: "budd.eth", role: "speaker" },
  { id: "11", name: "seetnforg…", role: "speaker" },
  { id: "12", name: "OGCO…", role: "listener", verified: true },
  { id: "13", name: "Dogelo…", role: "listener", verified: true },
  { id: "14", name: "NFT毒…", role: "listener", verified: true },
  { id: "15", name: "Holive…", role: "listener" },
  { id: "16", name: "Marco", role: "listener", verified: true },
];

/** ----------------------------------------------------------------------
 * Main component
 * ------------------------------------------------------------------- */
export default function RoomUI() {
  // Replace with real state in the future.
  const [participants] = useState<Participant[]>(SAMPLE_PARTICIPANTS);

  const hosts = participants.filter(
    (p) => p.role === "host" || p.role === "cohost",
  );
  const speakers = participants.filter((p) => p.role === "speaker");
  const listeners = participants.filter((p) => p.role === "listener");

  return (
    <main className="relative flex flex-col min-h-screen bg-black text-white overflow-y-auto">
      {/* Header */}
      <Header />

      {/* Title */}
      <h1 className="px-6 text-center text-lg font-bold leading-snug mt-4">
        Will Pump.fun TGE Suck Solana&apos;s Liquidity? Or it&apos;s Letsbonk
        Meta now?
      </h1>

      {/* Hosts & Co-hosts */}
      <section className="mt-6 flex flex-wrap justify-center gap-6 px-4">
        {hosts.map((h) => (
          <Avatar key={h.id} p={h} size={72} />
        ))}
      </section>

      {/* Speakers */}
      {speakers.length > 0 && (
        <section className="mt-8 grid grid-cols-4 gap-x-4 gap-y-8 px-4">
          {speakers.map((s) => (
            <Avatar key={s.id} p={s} size={64} />
          ))}
        </section>
      )}

      {/* Listeners */}
      {listeners.length > 0 && (
        <section className="mt-8 grid grid-cols-4 gap-x-4 gap-y-8 px-4 mb-32">
          {listeners.map((l) => (
            <Avatar key={l.id} p={l} size={56} />
          ))}
        </section>
      )}

      {/* Bottom bar */}
      <BottomBar />
    </main>
  );
}

/** ----------------------------------------------------------------------
 * Header (back, rec badge, menu, leave)
 * ------------------------------------------------------------------- */
function Header() {
  return (
    <header className="sticky top-0 flex items-center justify-between px-4 py-2 bg-black/80 backdrop-blur z-50">
      <button
        className="text-xl font-bold"
        // TODO: wire up navigation back / minimize action
      >
        &larr;
      </button>

      <div className="flex items-center gap-3">
        <span className="bg-red-600/90 rounded px-1.5 py-0.5 text-[10px] font-semibold">
          REC
        </span>
        <button className="text-2xl">•••</button>
      </div>

      <button
        className="text-red-500 font-semibold"
        // TODO: implement leave room logic
      >
        Leave
      </button>
    </header>
  );
}

/** ----------------------------------------------------------------------
 * Avatar component – displays role, mic status, verification, etc.
 * ------------------------------------------------------------------- */
interface AvatarProps {
  p: Participant;
  size?: number;
}

function Avatar({ p, size = 64 }: AvatarProps) {
  // Tailwind doesn't allow arbitrary numbers in width/height classes without plugins.
  // Instead use inline style.
  return (
    <div
      className="relative flex flex-col items-center"
      style={{ width: size }}
    >
      {/* Avatar image placeholder */}
      <div
        className="rounded-full bg-gray-600 flex items-center justify-center overflow-hidden"
        style={{ width: size, height: size }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {p.avatarUrl ? (
          <img
            src={p.avatarUrl}
            alt={p.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-sm">{p.name.charAt(0)}</span>
        )}
      </div>

      {/* Mute icon */}
      {p.role !== "listener" && (
        <span className="absolute -bottom-1 -right-1 bg-black rounded-full p-0.5">
          <Icon
            name={p.muted ? "mic" : "mic"}
            className={p.muted ? "text-red-500" : "text-green-400"}
          />
        </span>
      )}

      {/* Verification badge */}
      {p.verified && (
        <span className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 rounded-full bg-black p-[2px]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-3 h-3 text-blue-500"
          >
            <path
              fillRule="evenodd"
              d="M9.53 11.47a.75.75 0 011.06 0l2.22 2.22 3.97-3.97a.75.75 0 111.06 1.06l-4.5 4.5a.75.75 0 01-1.06 0l-2.75-2.75a.75.75 0 010-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      )}

      {/* Name & role */}
      <span className="mt-2 w-[72px] truncate text-center text-xs font-medium">
        {p.name}
      </span>
      {p.role !== "listener" && (
        <span className="text-[10px] text-pink-400 capitalize">{p.role}</span>
      )}
    </div>
  );
}

/** ----------------------------------------------------------------------
 * Bottom bar – actions (placeholders)
 * ------------------------------------------------------------------- */
function BottomBar() {
  return (
    <footer className="fixed bottom-0 left-0 w-full bg-black/60 backdrop-blur flex justify-around items-center px-4 py-3 z-50">
      <BarButton label="Mic" icon="mic" />
      <BarButton label="Invite" icon="users" />
      <BarButton label="Like" icon="heart" />
      <BarButton label="Share" icon="share" />
      <BarButton label="30" icon="chat" />
    </footer>
  );
}

interface BarButtonProps {
  label: string;
  icon: Parameters<typeof Icon>[0]["name"];
}

function BarButton({ label, icon }: BarButtonProps) {
  return (
    <button
      className="flex flex-col items-center text-white"
      // TODO: hook up action
    >
      <Icon name={icon} />
      <span className="text-[10px] mt-1">{label}</span>
    </button>
  );
}
