interface Props {
  hearts: Array<{ id: number; left: number }>;
}

export default function ReactionOverlay({ hearts }: Props) {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-40">
      {hearts.map((h) => (
        <span
          key={h.id}
          style={{ left: `${h.left}%` }}
          className="absolute bottom-10 text-pink-500 animate-heart-burst"
        >
          ❤
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
