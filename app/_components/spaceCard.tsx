// Sonic SpaceCard: mobile-first, thumb-perfect, shows host + 3 participant avatars for instant glance
// Twitter Spaces-style Card for Sonic Space (no crown, exact UI copy, but with Sora font and creative polish)
import { motion } from "framer-motion";
import Image from "next/image";
import { RoomWithMetadata } from "@/lib/types";

/**
 * SpaceCard: Sonic Space, mobile-first, vibrant, thumb-friendly.
 * - Purple card, rounded corners, shadow, no hover.
 * - Top row: LIVE badge, vertical dots, participant avatars, count.
 * - Title: bold, 2 lines max, ellipsis.
 * - Host row: avatar, name, Host badge, username, description.
 * - Sora font, all info at a glance, no overflow.
 */
export function SpaceCard({
  space,
  onClick,
}: {
  space: RoomWithMetadata;
  onClick: () => void;
}) {
  // Extract host and participants from metadata
  const host = space.metadata?.host;
  const participants = space.metadata?.participants ?? [];
  const title = space.metadata?.title || space.name;
  const participantCount = space.numParticipants ?? 1;
  const hostDisplayName = host?.displayName || host?.username || "Host";
  const hostAvatar = host?.avatarUrl || "/icon.png";
  const hostUsername = host?.username ? `@${host.username}` : "";
  // Show up to 4 participant avatars (including host)
  const avatarList = [
    { avatarUrl: hostAvatar, displayName: hostDisplayName, id: host?.id },
    ...participants
      .filter((p) => p.user?.id !== host?.id)
      .slice(0, 3)
      .map((p) => ({
        avatarUrl: p.user?.avatarUrl || "/icon.png",
        displayName: p.user?.displayName || p.user?.username || "Participant",
        id: p.user?.id,
      })),
  ];

  // Description: fallback to empty string if not present
  // @ts-expect-error: description may not exist on type, but we want to show it if present
  const description = space.metadata?.description || "";

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      className="w-full rounded-2xl shadow-lg flex flex-col"
      onClick={onClick}
      tabIndex={0}
      aria-label={`Join space: ${title}`}
      role="button"
      style={{
        fontFamily: "Sora, sans-serif",
        WebkitTapHighlightColor: "transparent",
        overflow: "hidden",
        userSelect: "none",
        minHeight: 180,
        background: "linear-gradient(180deg, #a18fff 0%, #7b5cff 100%)",
        boxShadow: "0 4px 24px 0 rgba(80, 60, 180, 0.18)",
      }}
    >
      {/* Top Row: LIVE badge, avatars, count, dots */}
      <div className="flex items-center justify-between px-4 pt-4">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-white text-xs font-bold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block mr-1" />
            LIVE
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Avatars */}
          <div className="flex -space-x-2">
            {avatarList.map((sp, idx) => (
              <div
                key={sp.id || idx}
                className="w-7 h-7 rounded-full overflow-hidden border-2 border-white shadow-sm flex-none relative"
                style={{
                  zIndex: 10 - idx,
                  background: "#e5e5e5",
                }}
              >
                <Image
                  src={sp.avatarUrl}
                  alt={sp.displayName}
                  width={28}
                  height={28}
                  className="object-cover w-full h-full"
                />
              </div>
            ))}
          </div>
          {/* Participant count */}
          <span className="ml-2 flex items-center gap-1 text-xs text-white/90 font-semibold">
            <svg
              className="w-4 h-4 text-white/80"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 1a4 4 0 0 1 4 4v5a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm6 9.5a1 1 0 0 1 2 0V12c0 4.418-3.134 8-7 8s-7-3.582-7-8v-1.5a1 1 0 1 1 2 0V12c0 3.314 2.239 6 5 6s5-2.686 5-6v-1.5z" />
            </svg>
            {participantCount} listening
          </span>
          {/* Dots menu (placeholder, not interactive) */}
          <span className="ml-2 flex items-center">
            <svg width={20} height={20} fill="none" viewBox="0 0 20 20">
              <circle cx={4} cy={10} r={1.5} fill="#fff" />
              <circle cx={10} cy={10} r={1.5} fill="#fff" />
              <circle cx={16} cy={10} r={1.5} fill="#fff" />
            </svg>
          </span>
        </div>
      </div>
      {/* Title */}
      <h3
        className="font-bold text-xl leading-snug text-white mt-3 mb-1 px-4"
        style={{
          fontFamily: "Sora, sans-serif",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
        title={title}
      >
        {title}
      </h3>
      {/* Host row */}
      <div className="flex items-center gap-2 px-4 pt-1 pb-2">
        <div className="relative w-7 h-7 rounded-full overflow-hidden border-2 border-white shadow-sm flex-none">
          <Image
            src={hostAvatar}
            alt={hostDisplayName}
            width={28}
            height={28}
            className="object-cover w-full h-full"
          />
        </div>
        <span className="text-white font-semibold text-sm truncate max-w-[7rem]">
          {hostDisplayName}
        </span>
        <span className="ml-1 px-2 py-0.5 rounded bg-white/20 text-xs text-white font-bold tracking-wide">
          Host
        </span>
        {hostUsername && (
          <span className="text-white/70 text-xs ml-1 truncate max-w-[5rem]">
            {hostUsername}
          </span>
        )}
      </div>
      {/* Host description row (if any) */}
      {description && (
        <div
          className="bg-[#8d7be6] rounded-b-2xl px-4 py-3 text-white/90 text-xs font-medium"
          style={{
            fontFamily: "Sora, sans-serif",
            minHeight: 36,
            lineHeight: 1.4,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {description}
        </div>
      )}
    </motion.div>
  );
}
