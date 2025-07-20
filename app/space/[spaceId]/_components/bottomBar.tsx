"use client";
import {
  MicrophoneMute,
  MicrophoneSpeaking,
  Heart as HeartIcon,
  User as UsersIcon,
  ShareAndroid as ShareIcon,
} from "iconoir-react";
import { cn } from "@/lib/utils";
import { useLocalParticipant } from "@livekit/components-react";

interface Props {
  onOpenReactionPicker: () => void;

  onInviteClick: () => void;
  className?: string;
}

export default function BottomBar({
  onOpenReactionPicker,
  onInviteClick,
  className,
}: Props) {
  const { localParticipant } = useLocalParticipant();

  return (
    <footer
      className={cn(
        "w-full bg-card/60 backdrop-blur flex justify-around items-center px-4 py-3 z-50",
        className,
      )}
    >
      {localParticipant.isMicrophoneEnabled ? (
        <BarButton
          label="Speaking"
          icon={MicrophoneSpeaking}
          onClick={() => {
            localParticipant.setMicrophoneEnabled(false);
          }}
        />
      ) : (
        <BarButton
          label="Muted"
          icon={MicrophoneMute}
          onClick={() => {
            localParticipant.setMicrophoneEnabled(true);
          }}
        />
      )}
      <BarButton label="Like" icon={HeartIcon} onClick={onOpenReactionPicker} />
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
  icon: React.ElementType;
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
