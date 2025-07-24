"use client";
import {
  Heart as HeartIcon,
  User as UsersIcon,
  ShareAndroid as ShareIcon,
  DragHandGesture,
  Square3dFromCenter,
} from "iconoir-react";
import { cn } from "@/lib/utils";
import { TrackToggle } from "@livekit/components-react";

import {
  useLocalParticipantPermissions,
  usePersistentUserChoices,
} from "@livekit/components-react";
import { useMaybeLayoutContext } from "@livekit/components-react";
import React from "react";
import { Track } from "livekit-client";

interface Props {
  roomName: string;
  onOpenReactionPicker: () => void;
  /** Opens tipping (reaction picker) */
  onBasedTipClick: () => void;
  /** Callback fired when the user taps the “Invite” button. */
  onInviteClick: () => void;
  /** Listener requests to speak (hand raise) */
  onRaiseHand: () => void;
}

export default function BottomBar({
  roomName,
  onOpenReactionPicker,
  onBasedTipClick,
  onInviteClick,
  onRaiseHand,
}: Props) {
  const [, setIsChatOpen] = React.useState(false);
  const layoutContext = useMaybeLayoutContext();
  React.useEffect(() => {
    if (layoutContext?.widget.state?.showChat !== undefined) {
      setIsChatOpen(layoutContext?.widget.state?.showChat);
    }
  }, [layoutContext?.widget.state?.showChat]);

  const localPermissions = useLocalParticipantPermissions();

  const canPublishMic =
    localPermissions &&
    localPermissions.canPublish &&
    (localPermissions.canPublishSources.length === 0 ||
      localPermissions.canPublishSources.includes(2));

  const { saveAudioInputEnabled } = usePersistentUserChoices({
    preventSave: true,
  });

  console.log("canPublishMic", canPublishMic);
  console.log("localPermissions", localPermissions);

  const microphoneOnChange = React.useCallback(
    (enabled: boolean, isUserInitiated: boolean) =>
      isUserInitiated ? saveAudioInputEnabled(enabled) : null,
    [saveAudioInputEnabled],
  );

  return (
    <footer
      className={cn(
        "w-full bg-card/60 backdrop-blur flex justify-around items-center px-4 py-3 z-50 fixed bottom-0 left-0 right-0",
      )}
    >
      {canPublishMic ? (
        <TrackToggle
          source={Track.Source.Microphone}
          showIcon={true}
          onChange={microphoneOnChange}
          onDeviceError={(error) => {
            console.error(error);
          }}
        ></TrackToggle>
      ) : (
        <BarButton
          label="Request to speak"
          icon={DragHandGesture}
          onClick={onRaiseHand}
        />
      )}

      <BarButton
        label="Based Tip"
        icon={Square3dFromCenter}
        onClick={onBasedTipClick}
      />

      <BarButton
        label="Reactions"
        icon={HeartIcon}
        onClick={onOpenReactionPicker}
      />

      {
        // <ChatToggle>
        //   <ChatIcon />
        //   {"Chat"}
        // </ChatToggle>
      }

      <BarButton
        label="Share"
        icon={ShareIcon}
        onClick={() => {
          try {
            navigator.clipboard.writeText(
              `${window.location.origin}/space/${roomName}`,
            );
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
