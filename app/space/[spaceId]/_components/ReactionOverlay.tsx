interface Props {
  reactions: Array<{ id: number; left: number; emoji: React.ReactNode }>;
}

export default function ReactionOverlay({ reactions }: Props) {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-40">
      {reactions.map((h) => (
        <span
          key={h.id}
          style={{ left: `${h.left}%` }}
          className="absolute bottom-10 animate-heart-burst"
        >
          {h.emoji}
        </span>
      ))}
      <style jsx>{`
        @keyframes heart-burst {
          0% {
            transform: translateY(0) scale(0.8);
            opacity: 0.9;
          }
          100% {
            transform: translateY(-200px) scale(1.4);
            opacity: 0;
          }
        }
        .animate-heart-burst {
          animation: heart-burst 2.5s ease-in forwards;
        }
      `}</style>
    </div>
  );
}
