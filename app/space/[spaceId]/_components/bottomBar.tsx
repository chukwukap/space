"use client";
import {
  MicrophoneMute,
  MicrophoneSpeaking,
  DragHandGesture as RaiseHandIcon,
  Heart as HeartIcon,
  User as UsersIcon,
  ShareAndroid as ShareIcon,
  List,
} from "iconoir-react";
import { cn } from "@/lib/utils";
import {
  useLocalParticipant,
  useLocalParticipantPermissions,
} from "@livekit/components-react";

interface Props {
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
  const { localParticipant } = useLocalParticipant();
  const localParticipantPermissions = useLocalParticipantPermissions();

  return (
    <footer
      className={cn(
        "w-full bg-card/60 backdrop-blur flex justify-around items-center px-4 py-3 z-50",
        className,
      )}
    >
      {localParticipantPermissions?.canPublish ? (
        localParticipant.isSpeaking ? (
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
        )
      ) : (
        <BarButton
          label={handRaiseLoading ? "..." : "Muted"}
          icon={RaiseHandIcon}
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
          icon={List}
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
