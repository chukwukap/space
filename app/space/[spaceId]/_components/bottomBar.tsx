"use client";
import {
  Heart as HeartIcon,
  User as UsersIcon,
  ShareAndroid as ShareIcon,
  DragHandGesture,
} from "iconoir-react";
import { cn } from "@/lib/utils";
import { useChatToggle, ChatIcon } from "@livekit/components-react";
import { useLocalParticipant, useRoomContext } from "@livekit/components-react";
import React, { useState } from "react";
import {
  Microphone as MicIcon,
  MicrophoneMute as MicOffIcon,
  LogOut,
} from "iconoir-react";

interface Props {
  onOpenReactionPicker: () => void;
  onTipClick: () => void;
  onInviteClick: () => void;
  onRaiseHand: () => void;
}

export default function BottomBar({
  onOpenReactionPicker,
  onTipClick,
  onInviteClick,
  onRaiseHand,
}: Props) {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();

  const canPublish = localParticipant?.permissions?.canPublish ?? false;

  const [micEnabled, setMicEnabled] = useState<boolean>(
    localParticipant?.isMicrophoneEnabled ?? false,
  );

  const toggleMic = async () => {
    if (!localParticipant) return;
    const newState = !micEnabled;
    await localParticipant.setMicrophoneEnabled(newState);
    setMicEnabled(newState);
  };

  // Chat toggle merged props
  const { mergedProps: chatBtnProps } = useChatToggle({ props: {} });

  const leaveRoom = async () => {
    await room.disconnect();
    window.location.href = "/";
  };

  return (
    <footer
      className={cn(
        "w-full bg-card/60 backdrop-blur flex justify-between items-center px-6 py-3 z-50 fixed bottom-0 left-0 right-0",
      )}
    >
      {/* Mic or Raise Hand */}
      {canPublish ? (
        <IconAction
          active={micEnabled}
          icon={micEnabled ? <MicIcon /> : <MicOffIcon />}
          label={micEnabled ? "Mute" : "Unmute"}
          onClick={toggleMic}
        />
      ) : (
        <IconAction
          icon={<DragHandGesture />}
          label="Request"
          onClick={onRaiseHand}
        />
      )}

      <IconAction icon={<HeartIcon />} label="Tip" onClick={onTipClick} />
      <IconAction
        icon={<HeartIcon />}
        label="React"
        onClick={onOpenReactionPicker}
      />

      <IconAction {...chatBtnProps} icon={<ChatIcon />} label="Chat" />

      <IconAction
        icon={<ShareIcon />}
        label="Share"
        onClick={() => navigator.clipboard.writeText(window.location.href)}
      />

      <IconAction icon={<UsersIcon />} label="Invite" onClick={onInviteClick} />

      <IconAction icon={<LogOut />} label="Leave" onClick={leaveRoom} danger />
    </footer>
  );
}

interface IconActionProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactElement;
  label: string;
  active?: boolean;
  danger?: boolean;
}

function IconAction({ icon, label, active, danger, ...rest }: IconActionProps) {
  return (
    <button
      className={cn(
        "flex flex-col items-center gap-1 text-xs group focus:outline-none",
        danger ? "text-destructive" : "text-foreground",
      )}
      {...rest}
    >
      <span
        className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
          active
            ? "bg-primary text-primary-foreground"
            : "bg-muted/20 group-hover:bg-muted/30",
        )}
      >
        {icon}
      </span>
      {label}
    </button>
  );
}
