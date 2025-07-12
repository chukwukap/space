"use client";
import { useState } from "react";
import Image from "next/image";
// Icon not used currently; remove if re-enabled later

export default function InviteSheet({ onClose }: { onClose: () => void }) {
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState(
    "Hey, just started my Space. Want to join?",
  );

  // Fake suggestion data
  const suggestions = [
    {
      id: 1,
      name: "Anmol",
      handle: "0xanmol",
      avatar: "/icon.png",
      verified: true,
    },
    {
      id: 2,
      name: "Anthony | Gib.Work",
      handle: "0xNullRef",
      avatar: "/hero.png",
      verified: true,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-[var(--app-background)] rounded-t-2xl shadow-lg animate-slide-up max-h-[85vh] w-full flex flex-col overflow-hidden">
        {/* drag handle */}
        <div className="h-1 w-10 bg-gray-500/50 rounded-full mx-auto mt-2 mb-3" />

        {/* Header */}
        <div className="flex justify-between items-center px-6 mb-2">
          <h2 className="text-lg font-semibold">Want to invite people?</h2>
          <button className="text-sm text-violet-400" onClick={onClose}>
            Skip
          </button>
        </div>
        <p className="text-sm text-gray-400 px-6 mb-4">
          People will join as listeners first.
        </p>

        {/* Search bar */}
        <div className="relative px-6 mb-4">
          <span className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <SearchIcon />
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for people and groups"
            className="w-full pl-10 pr-4 py-2 rounded-full bg-white/5 border border-white/10 placeholder-gray-400 focus:outline-none"
          />
        </div>

        {/* Suggestions list */}
        <div className="flex-1 overflow-y-auto px-2">
          {suggestions.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-lg cursor-pointer"
            >
              {p.avatar ? (
                <Image
                  src={p.avatar}
                  alt={p.name}
                  width={40}
                  height={40}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-gray-700 rounded-full" />
              )}
              <div className="flex flex-col flex-1 min-w-0">
                <span className="flex items-center gap-1 font-medium truncate">
                  {p.name}
                  {p.verified && <VerifiedBadge />}
                </span>
                <span className="text-sm text-gray-400 truncate">
                  {p.handle}
                </span>
              </div>
              <InviteTickIcon />
            </div>
          ))}
        </div>

        {/* Message + send */}
        <div className="relative px-4 py-3 border-t border-white/10">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full bg-white/5 rounded-full py-2 pl-4 pr-12 placeholder-gray-400 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="absolute right-6 top-1/2 -translate-y-1/2 text-violet-400 hover:text-violet-500"
          >
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

function SearchIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function SendIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      viewBox="0 0 24 24"
      className={className}
    >
      <path d="M22 2L11 13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function VerifiedBadge({
  className = "w-4 h-4 text-[#1D9BF0]",
}: {
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M22.5 12.03l-2.86-.66-.66-2.86a1.13 1.13 0 0 0-2.2 0l-.66 2.86-2.86.66a1.13 1.13 0 0 0 0 2.2l2.86.66.66 2.86a1.13 1.13 0 0 0 2.2 0l.66-2.86 2.86-.66a1.13 1.13 0 0 0 0-2.2z" />
    </svg>
  );
}

function InviteTickIcon({
  className = "w-5 h-5 text-violet-400",
}: {
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
