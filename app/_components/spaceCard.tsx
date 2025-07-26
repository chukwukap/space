// Card for each space in the list
// Card for each space in the list, now with rich UI/UX using full RoomWithMetadata & SpaceWithHostParticipant
import { motion } from "framer-motion";
import Image from "next/image";
import { RoomWithMetadata } from "@/lib/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Crown, User as UserIcon } from "lucide-react";

/**
 * SpaceCard displays a rich, interactive card for a live space.
 * It leverages all available metadata for a visually appealing and informative UI.
 * Security: Only non-sensitive data is displayed.
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

  // Show up to 5 speakers/hosts (excluding the main host)
  const speakerAvatars = participants
    .filter((p) => p.user?.id !== host?.id)
    .slice(0, 4)
    .map((p) => ({
      avatarUrl: p.user?.avatarUrl,
      displayName: p.user?.displayName || p.user?.username || "Speaker",
      id: p.user?.id,
    }));

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      className="w-full cursor-pointer rounded-2xl glass-card p-5 flex items-center gap-5 shadow-lg border border-primary/10 hover:border-primary/30 transition-all"
      onClick={onClick}
      tabIndex={0}
      aria-label={`Join space: ${title}`}
      role="button"
    >
      {/* Host Avatar with Crown */}
      <div className="relative w-14 h-14 rounded-full overflow-hidden bg-muted shrink-0 border-2 border-primary shadow">
        <Image
          src={hostAvatar}
          alt={`${hostDisplayName} avatar`}
          width={56}
          height={56}
          className="object-cover w-full h-full"
          priority
        />
        <span className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1 shadow">
          <Crown className="w-4 h-4 text-yellow-400" />
        </span>
      </div>

      {/* Main Content: Title, Host, Meta */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        {/* Space Title */}
        <h3
          className="font-bold text-lg leading-tight line-clamp-2"
          style={{ fontFamily: "Sora, sans-serif" }}
        >
          {title}
        </h3>
        {/* Host Info */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <UserIcon className="w-4 h-4" />
          <span className="font-medium">{hostDisplayName}</span>
          {host?.username && (
            <span className="text-primary/70 ml-1">@{host.username}</span>
          )}
        </div>
        {/* Meta: Participants, Recording, etc */}
        <div className="flex items-center gap-3 mt-1">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <svg
              className="w-3 h-3 text-destructive"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 1a4 4 0 0 1 4 4v5a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm6 9.5a1 1 0 0 1 2 0V12c0 4.418-3.134 8-7 8s-7-3.582-7-8v-1.5a1 1 0 1 1 2 0V12c0 3.314 2.239 6 5 6s5-2.686 5-6v-1.5z" />
            </svg>
            <span>{participantCount} listening</span>
          </span>
          {isRecording && (
            <span className="flex items-center gap-1 text-xs text-amber-600 font-semibold bg-amber-100 px-2 py-0.5 rounded-full">
              <svg className="w-2 h-2 fill-current mr-1" viewBox="0 0 8 8">
                <circle cx="4" cy="4" r="4" />
              </svg>
              Recording
            </span>
          )}
        </div>
        {/* Speaker Avatars */}
        {speakerAvatars.length > 0 && (
          <div className="flex items-center gap-1 mt-2">
            <TooltipProvider>
              {speakerAvatars.map((sp, idx) => (
                <Tooltip key={sp.id || idx}>
                  <TooltipTrigger asChild>
                    <div className="w-7 h-7 rounded-full overflow-hidden border-2 border-white -ml-2 first:ml-0 shadow">
                      <Image
                        src={sp.avatarUrl || "/icon.png"}
                        alt={sp.displayName}
                        width={28}
                        height={28}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">{sp.displayName}</TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
            <span className="ml-2 text-xs text-muted-foreground">
              {speakerAvatars.length === 1 ? "Speaker" : "Speakers"}
            </span>
          </div>
        )}
      </div>

      {/* Join badge */}
      <span className="text-base font-semibold px-4 py-2 rounded-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow hover:scale-105 transition-transform shrink-0">
        Join
      </span>
    </motion.div>
  );
}
