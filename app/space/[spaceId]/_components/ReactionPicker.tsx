"use client";

import React, { useEffect, useState } from "react";

const reactions: { type: string; emoji: string; label: string }[] = [
  { type: "heart", emoji: "❤️", label: "Like" },
  { type: "clap", emoji: "👏", label: "Clap" },
  { type: "fire", emoji: "🔥", label: "Fire" },
  { type: "lol", emoji: "😂", label: "Laugh" },
  { type: "hundred", emoji: "💯", label: "100" },
];

export type ReactionType = (typeof reactions)[number]["type"];

const LS_KEY = "tipAmounts";

export default function ReactionPicker({
  onPick,
  onClose,
}: {
  onPick: (type: ReactionType) => void;
  onClose: () => void;
}) {
  const [edit, setEdit] = useState(false);
  const [amounts, setAmounts] = useState<Record<string, string>>({});

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
    setAmounts({
      heart: "1",
      clap: "2",
      fire: "5",
      lol: "3",
      hundred: "10",
      ...stored,
    });
  }, []);

  const save = (next: Record<string, string>) => {
    setAmounts(next);
    localStorage.setItem(LS_KEY, JSON.stringify(next));
  };

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 bg-card/70 px-4 py-3 rounded-2xl backdrop-blur z-50">
      <div className="flex gap-3 mb-1">
        {reactions.map((r) => (
          <button
            key={r.type}
            aria-label={r.label}
            className="text-2xl hover:scale-110 transition-transform relative"
            onClick={() => {
              if (edit) return;
              onPick(r.type as ReactionType);
              onClose();
            }}
          >
            {r.emoji}
            {!edit && (
              <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px]">
                {amounts[r.type]}
              </span>
            )}
          </button>
        ))}
      </div>
      {edit && (
        <div className="flex gap-2">
          {reactions.map((r) => (
            <input
              key={r.type}
              value={amounts[r.type]}
              onChange={(e) => save({ ...amounts, [r.type]: e.target.value })}
              className="w-12 px-1 py-0.5 text-center text-xs rounded-md bg-background border border-border"
            />
          ))}
        </div>
      )}
      <button
        className="text-[10px] text-primary underline mt-1"
        onClick={() => setEdit((v) => !v)}
      >
        {edit ? "Done" : "Edit amounts"}
      </button>
    </div>
  );
}
