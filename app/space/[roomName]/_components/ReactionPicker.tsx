"use client";

import React from "react";
import { ReactionType } from "@/lib/generated/prisma";
import { REACTION_EMOJIS } from "@/lib/constants";
import { useClickOutside } from "@/app/hooks/useClickOutside";

/**
 * ReactionPicker component for Sonic Space
 * Uses useClickOutside hook for closing when clicking outside the picker.
 */
export default function ReactionPicker({
  onPick,
  onClose,
  loading = false,
}: {
  onPick: (type: ReactionType) => void;
  onClose: () => void;
  loading?: boolean;
}) {
  // Use the custom hook for outside click detection
  const ref = useClickOutside<HTMLDivElement>(() => {
    onClose();
  });

  return (
    <div
      ref={ref}
      className="fixed bottom-20 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 bg-card/70 px-4 py-3 rounded-2xl backdrop-blur z-50"
    >
      <div className="flex gap-3 mb-1">
        {Object.entries(REACTION_EMOJIS).map(([type, emoji]) => (
          <button
            key={type}
            aria-label={type}
            className="text-2xl hover:scale-110 transition-transform relative"
            onClick={() => {
              if (loading) return;
              onPick(type as unknown as ReactionType);
              onClose();
            }}
            disabled={loading}
          >
            {emoji}
          </button>
        ))}
      </div>
      {loading && (
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <span className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin inline-block" />
          Sending...
        </div>
      )}
    </div>
  );
}
