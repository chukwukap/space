interface Props {
  reactions: Array<{ id: number; left: number; emoji: React.ReactNode }>;
}

/**
 * ReactionOverlay
 *
 * Animates emoji reactions in Sonic Space with a magical, playful journey:
 * - Emojis rocket up in a wavy, bouncy arc, spin, and burst with color at the top,
 *   then bounce back down with a springy landing.
 * - Confetti and sparkles trail the emoji, making every tip feel like a party.
 * - Designed to make tipping feel delightful, memorable, and addictive.
 */
export default function ReactionOverlay({ reactions }: Props) {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-40">
      {reactions.map((h) => (
        <span
          key={h.id}
          style={{ left: `${h.left}%` }}
          className="absolute bottom-10 animate-reaction-joy"
        >
          <span className="reaction-emoji">
            {h.emoji}
            {/* Sparkle trail */}
            <span className="sparkle sparkle-1" />
            <span className="sparkle sparkle-2" />
            <span className="sparkle sparkle-3" />
          </span>
          {/* Confetti burst at the top */}
          <span className="confetti confetti-1" />
          <span className="confetti confetti-2" />
          <span className="confetti confetti-3" />
        </span>
      ))}
      <style jsx>{`
        /* Main emoji animation: up, arc, spin, burst, bounce down */
        @keyframes reaction-joy {
          0% {
            transform: translateY(0) scale(0.8) rotate(-10deg);
            opacity: 0.95;
            filter: drop-shadow(0 2px 8px #ffb6f9);
          }
          10% {
            transform: translateY(-10vh) scale(1.1) rotate(8deg);
            opacity: 1;
            filter: drop-shadow(0 4px 16px #f7c873);
          }
          25% {
            transform: translateY(-40vh) translateX(-10vw) scale(1.3)
              rotate(-18deg);
            filter: drop-shadow(0 8px 24px #7be5ff);
          }
          40% {
            transform: translateY(-80vh) translateX(8vw) scale(1.6)
              rotate(24deg);
            filter: drop-shadow(0 12px 32px #ffb6f9);
          }
          50% {
            /* At the top, burst and spin */
            transform: translateY(-98vh) scale(2.1) rotate(360deg);
            filter: drop-shadow(0 0px 40px #fff6b6);
            opacity: 1;
          }
          55% {
            /* Burst effect, slightly larger */
            transform: translateY(-100vh) scale(2.3) rotate(390deg);
            filter: drop-shadow(0 0px 60px #fff6b6);
            opacity: 1;
          }
          60% {
            /* Start falling, shrink a bit */
            transform: translateY(-90vh) scale(1.7) rotate(420deg);
            filter: drop-shadow(0 8px 32px #f7c873);
            opacity: 0.95;
          }
          75% {
            transform: translateY(-40vh) scale(1.2) rotate(440deg);
            filter: drop-shadow(0 4px 16px #7be5ff);
            opacity: 0.9;
          }
          90% {
            /* Bounce landing */
            transform: translateY(0) scale(1.05) rotate(460deg);
            filter: drop-shadow(0 2px 8px #ffb6f9);
            opacity: 0.8;
          }
          95% {
            /* Little bounce up */
            transform: translateY(-2vh) scale(1.1) rotate(470deg);
            opacity: 0.7;
          }
          100% {
            /* Settle and fade out */
            transform: translateY(0) scale(0.8) rotate(480deg);
            opacity: 0;
            filter: drop-shadow(0 2px 8px #ffb6f9);
          }
        }
        .animate-reaction-joy {
          animation: reaction-joy 3.2s cubic-bezier(0.68, -0.6, 0.32, 1.6)
            forwards;
          will-change: transform, opacity, filter;
          font-size: 2.7rem;
          pointer-events: none;
          user-select: none;
          position: absolute;
        }
        .reaction-emoji {
          display: inline-block;
          position: relative;
          animation: emoji-wiggle 1.5s ease-in-out 0.2s 2 alternate;
        }
        @keyframes emoji-wiggle {
          0% {
            transform: rotate(-10deg) scale(1);
          }
          20% {
            transform: rotate(12deg) scale(1.1);
          }
          40% {
            transform: rotate(-8deg) scale(1.15);
          }
          60% {
            transform: rotate(8deg) scale(1.1);
          }
          80% {
            transform: rotate(-6deg) scale(1.05);
          }
          100% {
            transform: rotate(0deg) scale(1);
          }
        }
        /* Sparkle trail styles */
        .sparkle {
          position: absolute;
          width: 0.5rem;
          height: 0.5rem;
          border-radius: 50%;
          opacity: 0.7;
          pointer-events: none;
          z-index: 2;
        }
        .sparkle-1 {
          background: #fff6b6;
          left: 60%;
          top: 60%;
          animation: sparkle-float-1 1.2s ease-out 0.1s 1;
        }
        .sparkle-2 {
          background: #ffb6f9;
          left: 30%;
          top: 80%;
          animation: sparkle-float-2 1.2s ease-out 0.2s 1;
        }
        .sparkle-3 {
          background: #7be5ff;
          left: 80%;
          top: 40%;
          animation: sparkle-float-3 1.2s ease-out 0.3s 1;
        }
        @keyframes sparkle-float-1 {
          0% {
            transform: scale(0.7) translateY(0);
            opacity: 0.8;
          }
          60% {
            transform: scale(1.2) translateY(-1.2rem);
            opacity: 1;
          }
          100% {
            transform: scale(0.8) translateY(-2.2rem);
            opacity: 0;
          }
        }
        @keyframes sparkle-float-2 {
          0% {
            transform: scale(0.7) translateY(0);
            opacity: 0.8;
          }
          60% {
            transform: scale(1.2) translateY(-1.5rem);
            opacity: 1;
          }
          100% {
            transform: scale(0.8) translateY(-2.7rem);
            opacity: 0;
          }
        }
        @keyframes sparkle-float-3 {
          0% {
            transform: scale(0.7) translateY(0);
            opacity: 0.8;
          }
          60% {
            transform: scale(1.2) translateY(-1.1rem);
            opacity: 1;
          }
          100% {
            transform: scale(0.8) translateY(-2rem);
            opacity: 0;
          }
        }
        /* Confetti burst styles */
        .confetti {
          position: absolute;
          top: -2.5rem;
          left: 50%;
          width: 0.7rem;
          height: 0.7rem;
          border-radius: 50%;
          opacity: 0.8;
          pointer-events: none;
          z-index: 1;
        }
        .confetti-1 {
          background: #ffb6f9;
          animation: confetti-burst-1 1.1s cubic-bezier(0.7, 0, 0.3, 1) 0.5s 1;
        }
        .confetti-2 {
          background: #f7c873;
          animation: confetti-burst-2 1.1s cubic-bezier(0.7, 0, 0.3, 1) 0.6s 1;
        }
        .confetti-3 {
          background: #7be5ff;
          animation: confetti-burst-3 1.1s cubic-bezier(0.7, 0, 0.3, 1) 0.7s 1;
        }
        @keyframes confetti-burst-1 {
          0% {
            transform: translate(-50%, 0) scale(0.7);
            opacity: 0.8;
          }
          60% {
            transform: translate(-120%, -2.5rem) scale(1.2);
            opacity: 1;
          }
          100% {
            transform: translate(-180%, -4rem) scale(0.8);
            opacity: 0;
          }
        }
        @keyframes confetti-burst-2 {
          0% {
            transform: translate(-50%, 0) scale(0.7);
            opacity: 0.8;
          }
          60% {
            transform: translate(0%, -2.8rem) scale(1.2);
            opacity: 1;
          }
          100% {
            transform: translate(40%, -4.5rem) scale(0.8);
            opacity: 0;
          }
        }
        @keyframes confetti-burst-3 {
          0% {
            transform: translate(-50%, 0) scale(0.7);
            opacity: 0.8;
          }
          60% {
            transform: translate(80%, -2.2rem) scale(1.2);
            opacity: 1;
          }
          100% {
            transform: translate(140%, -3.5rem) scale(0.8);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
