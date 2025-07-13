"use client";

import React from "react";

const reactions: { type: string; emoji: string; label: string }[] = [
  { type: "heart", emoji: "❤️", label: "Like" },
  { type: "clap", emoji: "👏", label: "Clap" },
  { type: "fire", emoji: "🔥", label: "Fire" },
  { type: "lol", emoji: "😂", label: "Laugh" },
  { type: "hundred", emoji: "💯", label: "100" },
];

export type ReactionType = (typeof reactions)[number]["type"];

export default function ReactionPicker({
  onPick,
  onClose,
}: {
  onPick: (type: ReactionType) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 flex gap-3 bg-black/70 px-4 py-2 rounded-full backdrop-blur z-50">
      {reactions.map((r) => (
        <button
          key={r.type}
          aria-label={r.label}
          className="text-2xl hover:scale-110 transition-transform"
          onClick={() => {
            onPick(r.type as ReactionType);
            onClose();
          }}
        >
          {r.emoji}
        </button>
      ))}
    </div>
  );
}
