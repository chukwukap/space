"use client";
import {
  Mic2 as MicIcon,
  HandMetal as HandIcon,
  Heart as HeartIcon,
  Users as UsersIcon,
  Share2 as ShareIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  isSpeaker: boolean;
  onToggleMic: () => void;
  onRaiseHand: () => void;
  onOpenReactionPicker: () => void;
  likes: number;
  handRaiseCount: number;
  isHost: boolean;
  onQueueClick: () => void;
  className?: string;
}

export default function BottomBar({
  isSpeaker,
  onToggleMic,
  onRaiseHand,
  onOpenReactionPicker,
  likes,
  handRaiseCount,
  isHost,
  onQueueClick,
  className,
}: Props) {
  return (
    <footer
      className={cn(
        "w-full bg-black/60 backdrop-blur flex justify-around items-center px-4 py-3 z-50",
        className,
      )}
    >
      {isSpeaker ? (
        <BarButton label="Mic" icon={MicIcon} onClick={onToggleMic} />
      ) : (
        <BarButton label="Request" icon={HandIcon} onClick={onRaiseHand} />
      )}
      <BarButton
        label={String(likes)}
        icon={HeartIcon}
        onClick={onOpenReactionPicker}
      />
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
      <BarButton label="Invite" icon={UsersIcon} onClick={() => {}} />
    </footer>
  );
}

interface BarButtonProps {
  label: string;
  icon: typeof MicIcon;
  onClick: () => void;
}

function BarButton({ label, icon: IconCmp, onClick }: BarButtonProps) {
  return (
    <button
      className="flex flex-col items-center text-white hover:opacity-90"
      onClick={onClick}
    >
      <IconCmp className="w-6 h-6" />
      <span className="text-[10px] mt-1">{label}</span>
    </button>
  );
}
