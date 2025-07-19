"use client";
import {
  Mic2 as MicIcon,
  HandMetal as HandIcon,
  Heart as HeartIcon,
  Users as UsersIcon,
  Share2 as ShareIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Participant } from "livekit-client";

interface Props {
  p: Participant | null;
  onToggleMic: () => void;
  onRaiseHand: () => void;
  onOpenReactionPicker: () => void;
  likes: number;
  handRaiseCount: number;
  isHost: boolean;
  onQueueClick: () => void;
  /** Opens tipping (reaction picker) */
  onTipClick: () => void;
  /** Callback fired when the user taps the “Invite” button. */
  onInviteClick: () => void;
  className?: string;
  handRaiseLoading?: boolean;
}

export default function BottomBar({
  p,
  onToggleMic,
  onRaiseHand,
  onOpenReactionPicker,
  likes,
  handRaiseCount,
  isHost,
  onQueueClick,
  onTipClick,
  onInviteClick,
  className,
  handRaiseLoading = false,
}: Props) {
  return (
    <footer
      className={cn(
        "w-full bg-card/60 backdrop-blur flex justify-around items-center px-4 py-3 z-50",
        className,
      )}
    >
      {p?.isMicrophoneEnabled ? (
        <BarButton label="Mic" icon={MicIcon} onClick={onToggleMic} />
      ) : (
        <BarButton
          label={handRaiseLoading ? "..." : "Request"}
          icon={MicIcon}
          onClick={onRaiseHand}
          disabled={handRaiseLoading}
          loading={handRaiseLoading}
        />
      )}
      <BarButton
        label={String(likes)}
        icon={HeartIcon}
        onClick={onOpenReactionPicker}
      />
      <BarButton label="Tip" icon={HeartIcon} onClick={onTipClick} />
      {isHost && handRaiseCount > 0 && (
        <BarButton
          label={`Queue(${handRaiseCount})`}
          icon={HandIcon}
          onClick={onQueueClick}
        />
      )}
      <BarButton
        label="Share"
        icon={ShareIcon}
        onClick={() => {
          try {
            navigator.clipboard.writeText(window.location.href);
          } catch {}
        }}
      />
      <BarButton label="Invite" icon={UsersIcon} onClick={onInviteClick} />
    </footer>
  );
}

interface BarButtonProps {
  label: string;
  icon: typeof MicIcon;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

function BarButton({
  label,
  icon: IconCmp,
  onClick,
  disabled,
  loading,
}: BarButtonProps) {
  return (
    <button
      className="flex flex-col items-center text-foreground hover:opacity-90 disabled:opacity-50"
      onClick={onClick}
      disabled={disabled}
    >
      {loading ? (
        <span className="w-6 h-6 flex items-center justify-center">
          <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin inline-block" />
        </span>
      ) : (
        <IconCmp className="w-6 h-6" />
      )}
      <span className="text-[10px] mt-1">{label}</span>
    </button>
  );
}
