// Card for each space in the list
// Card for each space in the list, now with rich UI/UX using full RoomWithMetadata & SpaceWithHostParticipant
// Sonic SpaceCard: mobile-first, thumb-perfect, shows host + 3 participant avatars for instant glance
import { motion } from "framer-motion";
import Image from "next/image";
import { RoomWithMetadata } from "@/lib/types";
import { Crown, User as UserIcon } from "lucide-react";

/**
 * SpaceCard: mobile-optimized, overflow-proof, thumb-friendly, and visually sweet.
 * - Host avatar, 3 participant avatars, all info at a glance.
 * - Sora font, playful color, big tap target, all info in a single row.
 * - No hover, no overflow, no crowding.
 */
export function SpaceCard({
  space,
  onClick,
}: {
  space: RoomWithMetadata;
  onClick: () => void;
}) {
  const host = space.metadata?.host;
  const participants = space.metadata?.participants ?? [];
  const title = space.metadata?.title || space.name;
  const isRecording = !!space.metadata?.recording;
  const participantCount = space.numParticipants ?? 1;
  const hostDisplayName = host?.displayName || host?.username || "Host";
  const hostAvatar = host?.avatarUrl || "/icon.png";

  // Show up to 3 participant avatars (excluding host)
  const participantAvatars = participants
    .filter((p) => p.user?.id !== host?.id)
    .slice(0, 3)
    .map((p) => ({
      avatarUrl: p.user?.avatarUrl,
      displayName: p.user?.displayName || p.user?.username || "Participant",
      id: p.user?.id,
    }));

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      className="w-full max-w-full rounded-xl bg-white/90 dark:bg-zinc-900/90 px-3 py-2 flex items-center gap-3 shadow-sm border border-primary/10 active:scale-[0.98] transition-all"
      onClick={onClick}
      tabIndex={0}
      aria-label={`Join space: ${title}`}
      role="button"
      style={{
        minHeight: 72,
        fontFamily: "Sora, sans-serif",
        WebkitTapHighlightColor: "transparent",
        overflow: "hidden",
        userSelect: "none",
      }}
    >
      {/* Host Avatar with Crown */}
      <div className="relative w-12 h-12 rounded-full overflow-hidden bg-muted shrink-0 border-2 border-primary shadow-sm flex-none">
        <Image
          src={hostAvatar}
          alt={`${hostDisplayName} avatar`}
          width={48}
          height={48}
          className="object-cover w-full h-full"
          priority
        />
        <span className="absolute -bottom-1 -right-1 bg-gradient-to-tr from-yellow-300 to-yellow-500 rounded-full p-0.5 shadow-md border-2 border-white dark:border-zinc-900">
          <Crown className="w-3 h-3 text-yellow-700" />
        </span>
      </div>

      {/* Main Content: All info in a single column, no overflow */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        {/* Title and Join badge row */}
        <div className="flex items-center min-w-0">
          <h3
            className="font-bold text-base leading-tight truncate text-zinc-900 dark:text-zinc-100 flex-1"
            style={{ fontFamily: "Sora, sans-serif" }}
            title={title}
          >
            {title}
          </h3>
          {/* Join badge: always visible, never overflows */}
          <span
            className="ml-2 text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-br from-fuchsia-500 to-indigo-500 text-white shadow-md flex-none"
            style={{
              fontFamily: "Sora, sans-serif",
              minWidth: 48,
              textAlign: "center",
              letterSpacing: "0.01em",
              lineHeight: 1.2,
            }}
          >
            Join
          </span>
        </div>
        {/* Host Info and Meta row */}
        <div className="flex items-center gap-2 mt-0.5 min-w-0">
          <span className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-300 truncate">
            <UserIcon className="w-3 h-3" />
            <span className="font-medium truncate max-w-[5.5rem]">
              {hostDisplayName}
            </span>
            {host?.username && (
              <span className="text-primary/70 ml-1 truncate max-w-[4rem]">
                @{host.username}
              </span>
            )}
          </span>
          <span className="flex items-center gap-1 text-xs text-zinc-400 dark:text-zinc-300 flex-none">
            <svg
              className="w-3 h-3 text-rose-500"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 1a4 4 0 0 1 4 4v5a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm6 9.5a1 1 0 0 1 2 0V12c0 4.418-3.134 8-7 8s-7-3.582-7-8v-1.5a1 1 0 1 1 2 0V12c0 3.314 2.239 6 5 6s5-2.686 5-6v-1.5z" />
            </svg>
            <span>{participantCount}</span>
          </span>
          {isRecording && (
            <span className="flex items-center gap-1 text-xs text-amber-600 font-semibold bg-amber-100/80 px-2 py-0.5 rounded-full flex-none">
              <svg className="w-2 h-2 fill-current mr-1" viewBox="0 0 8 8">
                <circle cx="4" cy="4" r="4" />
              </svg>
              REC
            </span>
          )}
        </div>
        {/* Participant Avatars row */}
        {participantAvatars.length > 0 && (
          <div className="flex items-center gap-0.5 mt-1 min-w-0">
            <div className="flex -space-x-2">
              {participantAvatars.map((sp, idx) => (
                <div
                  key={sp.id || idx}
                  className="w-7 h-7 rounded-full overflow-hidden border-2 border-white dark:border-zinc-900 shadow-sm flex-none"
                  style={{
                    zIndex: 10 - idx,
                  }}
                >
                  <Image
                    src={sp.avatarUrl || "/icon.png"}
                    alt={sp.displayName}
                    width={28}
                    height={28}
                    className="object-cover w-full h-full"
                  />
                </div>
              ))}
            </div>
            <span className="ml-2 text-xs text-zinc-400 dark:text-zinc-300 truncate">
              {participantAvatars.length === 1 ? "Participant" : "Participants"}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
