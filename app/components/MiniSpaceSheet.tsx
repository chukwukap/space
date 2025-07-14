"use client";

import { Heart, MessageCircle, Mic, Share, Users } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface MiniSpaceSheetProps {
  onClose: () => void;
  onEnd: () => void;
  title?: string;
  host: {
    name: string;
    avatarUrl?: string;
    verified?: boolean;
  };
  listeners?: number;
}

/**
 * MiniSpaceSheet renders a compact bottom sheet shown while hosting a Space,
 * similar to Twitter/X. It exposes only presentation; lift all business logic
 * (LiveKit events, Farcaster actions, etc.) to the parent component.
 */
export default function MiniSpaceSheet({
  onClose,
  onEnd,
  title = "What do you want to talk about?",
  host,
  listeners = 0,
}: MiniSpaceSheetProps) {
  const [micOn, setMicOn] = useState(false);
  const [liked, setLiked] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end pointer-events-none">
      {/* overlay – click-through except sheet area */}
      <div
        className="absolute inset-0 bg-background/60 pointer-events-auto"
        onClick={onClose}
      />

      {/* SHEET */}
      <div className="relative bg-card/90 backdrop-blur-md rounded-t-2xl pt-2 pb-4 px-4 pointer-events-auto animate-slide-up text-foreground">
        {/* drag handle / header */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={onClose}
            className="p-2 text-gray-300 hover:text-white"
          >
            <ChevronDownIcon />
          </button>
          <button className="p-2 text-gray-300 hover:text-white">
            <DotsVerticalIcon />
          </button>
          <button
            onClick={onEnd}
            className="text-red-500 font-semibold text-sm px-2 py-1"
          >
            End
          </button>
        </div>

        {/* title */}
        <h3 className="flex items-center gap-2 text-lg font-semibold mb-4 leading-snug text-white">
          <PencilIcon className="w-5 h-5 text-gray-400" />
          {title}
        </h3>

        {/* host section */}
        <div className="flex items-center gap-3 mb-4">
          {host.avatarUrl ? (
            <Image
              src={host.avatarUrl}
              alt={host.name}
              width={48}
              height={48}
              className="rounded-full"
            />
          ) : (
            <div className="w-12 h-12 bg-gray-700 rounded-full" />
          )}
          <div className="flex flex-col">
            <span className="flex items-center gap-1 text-white font-medium">
              {truncate(host.name, 14)}
              {host.verified && <VerifiedBadge />}
            </span>
            <span className="text-xs text-gray-400">Host</span>
          </div>
        </div>

        {/* Bottom controls */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-around items-center py-2">
            {/* MIC */}
            <button
              onClick={() => setMicOn((v) => !v)}
              className="flex flex-col items-center text-white"
            >
              <Mic name="mic-filled" />
              <span className="text-[10px] mt-1">
                {micOn ? "Mic on" : "Mic off"}
              </span>
            </button>

            {/* LISTENERS */}
            <button className="flex flex-col items-center text-white">
              <Users name="users-filled" />
              <span className="text-[10px] mt-1">
                {listeners.toLocaleString()}
              </span>
            </button>

            {/* LIKE */}
            <button
              onClick={() => setLiked((v) => !v)}
              className={`flex flex-col items-center ${liked ? "text-pink-400" : "text-white"}`}
            >
              <Heart name="heart-filled" />
              <span className="text-[10px] mt-1">Like</span>
            </button>

            {/* SHARE */}
            <button className="flex flex-col items-center text-white">
              <Share name="share-2" />
              <span className="text-[10px] mt-1">Share</span>
            </button>

            {/* CHAT */}
            <button className="flex flex-col items-center text-white">
              <MessageCircle name="message-circle" />
              <span className="text-[10px] mt-1">0</span>
            </button>
          </div>
          <span className="text-center text-xs text-gray-400">
            Mic is {micOn ? "on" : "off"}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function truncate(str: string, max: number) {
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}

function VerifiedBadge() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-4 h-4 text-[#1D9BF0]"
    >
      <path d="M22.5 12.03l-2.86-.66-.66-2.86a1.13 1.13 0 0 0-2.2 0l-.66 2.86-2.86.66a1.13 1.13 0 0 0 0 2.2l2.86.66.66 2.86a1.13 1.13 0 0 0 2.2 0l.66-2.86 2.86-.66a1.13 1.13 0 0 0 0-2.2z" />
    </svg>
  );
}

function ChevronDownIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="currentColor"
      className={className}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function DotsVerticalIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      viewBox="0 0 24 24"
      className={className}
    >
      <circle cx="12" cy="5" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="19" r="2" />
    </svg>
  );
}

function PencilIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.862 3.487l2.651 2.65a1.5 1.5 0 010 2.122l-9.193 9.194a3 3 0 01-1.06.662l-3.378 1.125a.75.75 0 01-.949-.949l1.125-3.378a3 3 0 01.662-1.06l9.193-9.193a1.5 1.5 0 012.122 0z"
      />
    </svg>
  );
}

/* Simple tailwind animation class (slide-up) may already exist; if not, define in globals.css:
@layer utilities {
  .animate-slide-up {
    @apply translate-y-full opacity-0 transition-all duration-300;
    &.animate-slide-up {
      @apply translate-y-0 opacity-100;
    }
  }
}
*/

// {
//   showMini && (
//     <MiniSpaceSheet
//       onClose={() => setShowMini(false)}
//       onEnd={() => {
//         /* TODO */
//       }}
//       host={{
//         name: viewer?.username ?? "You",
//         avatarUrl: viewer?.pfpUrl,
//         verified: true,
//       }}
//       listeners={3711}
//     />
//   );
// }
