import React from "react";

/**
 * Props for ReactionOverlay component.
 * - reactions: Array of reaction objects, each with a unique id, left position, and emoji node.
 */
interface Props {
  reactions: Array<{ id: number; left: number; emoji: React.ReactNode }>;
}

/**
 * ReactionOverlay
 *
 * Animates emoji reactions in Sonic Space with a gentle, sweet float-up and fade-out.
 * - Emojis float up smoothly and fade out, with a subtle wiggle for delight.
 * - No confetti or sparkles for a cleaner, less overwhelming effect.
 * - Designed to be pleasant, non-distracting, and memorable.
 */
export default function ReactionOverlay({ reactions }: Props) {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-40">
      {reactions.map((h) => (
        <span
          key={h.id}
          style={{ left: `${h.left}%` }}
          className="absolute bottom-10 animate-reaction-float"
        >
          <span className="reaction-emoji">{h.emoji}</span>
        </span>
      ))}
      <style jsx>{`
        /* Main emoji animation: float up and fade out with a gentle wiggle */
        @keyframes reaction-float {
          0% {
            transform: translateY(0) scale(1) rotate(-8deg);
            opacity: 0.95;
            filter: drop-shadow(0 2px 8px #ffb6f9);
          }
          20% {
            transform: translateY(-1.5rem) scale(1.08) rotate(8deg);
            opacity: 1;
          }
          60% {
            transform: translateY(-5.5rem) scale(1.12) rotate(-6deg);
            opacity: 0.92;
          }
          90% {
            transform: translateY(-7rem) scale(1.05) rotate(0deg);
            opacity: 0.7;
          }
          100% {
            transform: translateY(-8rem) scale(0.95) rotate(0deg);
            opacity: 0;
            filter: drop-shadow(0 2px 8px #ffb6f9);
          }
        }
        .animate-reaction-float {
          animation: reaction-float 1.7s cubic-bezier(0.45, 0, 0.55, 1) forwards;
          will-change: transform, opacity, filter;
          font-size: 2.2rem;
          pointer-events: none;
          user-select: none;
          position: absolute;
        }
        .reaction-emoji {
          display: inline-block;
          position: relative;
          animation: emoji-wiggle 1.1s ease-in-out 0.1s 1 alternate;
        }
        /* Subtle wiggle for the emoji */
        @keyframes emoji-wiggle {
          0% {
            transform: rotate(-8deg) scale(1);
          }
          20% {
            transform: rotate(8deg) scale(1.05);
          }
          40% {
            transform: rotate(-6deg) scale(1.08);
          }
          60% {
            transform: rotate(6deg) scale(1.05);
          }
          80% {
            transform: rotate(-4deg) scale(1.02);
          }
          100% {
            transform: rotate(0deg) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
