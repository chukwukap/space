"use client";

import React from "react";
import {
  ShareAndroid as ShareIcon,
  Square3dFromCenter,
  MicrophoneMuteSolid,
  CheckCircle,
} from "iconoir-react";
import { cn } from "@/lib/utils";
import {
  TrackToggle,
  useLocalParticipantPermissions,
  usePersistentUserChoices,
  useMaybeLayoutContext,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { REACTION_EMOJIS } from "@/lib/constants";

/**
 * Props for the BottomBar component.
 * - roomName: The current room's name.
 * - onOpenReactionPicker: Opens the reaction picker modal.
 * - onBasedTipClick: Opens the tipping modal.
 * - requestToSpeak: Callback for the "Request to Speak" button.
 * - hasRequested: Whether the user has already requested to speak.
 * - onSendReaction: Function to send a reaction emoji.
 * - reactionLoading: Show loading state for reaction button.
 */
interface Props {
  roomName: string;
  onBasedTipClick: () => void;
  requestToSpeak: () => void;
  hasRequested: boolean;
  onSendReaction: (emoji: string) => void;
}

/**
 * BottomBar
 *
 * The persistent bottom bar for the TipSpace room.
 * - Shows mic toggle or "Request to Speak" depending on permissions.
 * - Provides quick access to tipping, reactions, sharing, and quick emoji bar.
 * - Security: Only exposes mic toggle if user has publish permissions.
 * - Mobile-first, creative UI, Sora font, no hover effects.
 */
export default function BottomBar({
  roomName,
  onBasedTipClick,
  requestToSpeak,
  hasRequested,
  onSendReaction,
}: Props) {
  // State for chat open/close (future use)
  const [, setIsChatOpen] = React.useState(false);
  const layoutContext = useMaybeLayoutContext();

  // Sync chat open state with layout context (if available)
  React.useEffect(() => {
    if (layoutContext?.widget.state?.showChat !== undefined) {
      setIsChatOpen(layoutContext?.widget.state?.showChat);
    }
  }, [layoutContext?.widget.state?.showChat]);

  // Get local participant permissions securely
  const localPermissions = useLocalParticipantPermissions();

  // Determine if the user can publish microphone audio
  const canPublishMic =
    localPermissions &&
    localPermissions.canPublish &&
    (localPermissions.canPublishSources.length === 0 ||
      localPermissions.canPublishSources.includes(2));

  // Securely persist user audio input choices (do not save if preventSave)
  const { saveAudioInputEnabled } = usePersistentUserChoices({
    preventSave: true,
  });

  /**
   * Handle microphone toggle changes.
   * Only persist if user initiated (security: avoid programmatic toggles).
   */
  const microphoneOnChange = React.useCallback(
    (enabled: boolean, isUserInitiated: boolean) =>
      isUserInitiated ? saveAudioInputEnabled(enabled) : null,
    [saveAudioInputEnabled],
  );

  /**
   * Securely handle sharing the room link.
   * Uses the Clipboard API and catches errors to avoid leaking sensitive info.
   */
  const handleShare = React.useCallback(() => {
    try {
      navigator.clipboard.writeText(
        `${window.location.origin}/space/${roomName}`,
      );
    } catch (err) {
      console.error("[ClipboardError]", err);
      // Security: Do not leak clipboard errors to UI
    }
  }, [roomName]);

  // Creative, non-generic emoji bar for quick reactions (mobile-first)
  const quickReactions = [
    REACTION_EMOJIS.LIKE,
    REACTION_EMOJIS.LAUGH,
    REACTION_EMOJIS.FIRE,
    REACTION_EMOJIS.HEART,
    REACTION_EMOJIS.CLAP,
  ];

  return (
    <footer
      className={cn(
        "w-full bg-card/60 backdrop-blur flex flex-col items-center px-4 py-2 z-50 fixed bottom-0 left-0 right-0",
      )}
      style={{ fontFamily: "Sora, sans-serif" }}
    >
      <div className="flex w-full justify-around items-center">
        {canPublishMic ? (
          <TrackToggle
            source={Track.Source.Microphone}
            showIcon={true}
            onChange={microphoneOnChange}
            onDeviceError={(error) => {
              // Security: Log device errors for diagnostics, do not leak to UI
              console.error("[MicDeviceError]", error);
            }}
          />
        ) : hasRequested ? (
          <BarButton
            label="Request sent"
            icon={CheckCircle}
            onClick={requestToSpeak}
          />
        ) : (
          <BarButton
            label="Request to speak"
            icon={MicrophoneMuteSolid}
            onClick={requestToSpeak}
          />
        )}

        <BarButton
          label="Based Tip"
          icon={Square3dFromCenter}
          onClick={onBasedTipClick}
        />

        <BarButton label="Share" icon={ShareIcon} onClick={handleShare} />
      </div>
      {/* Quick emoji bar (mobile-first, no hover) */}
      <div className="flex gap-2 mt-2">
        {quickReactions.map((emoji) => (
          <button
            key={emoji}
            className="rounded-full bg-muted px-2 py-1 text-xl shadow transition active:scale-95"
            style={{
              fontFamily: "Sora, sans-serif",
              border: "none",
              outline: "none",
            }}
            onClick={() => onSendReaction(emoji)}
            aria-label={`Send ${emoji} reaction`}
            type="button"
          >
            {emoji}
          </button>
        ))}
      </div>
    </footer>
  );
}

/**
 * Props for the BarButton component.
 * - label: Button label.
 * - icon: Icon component.
 * - onClick: Click handler.
 * - disabled: Optional, disables the button.
 * - loading: Optional, shows a loading spinner.
 */
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
      className="flex flex-col items-center text-foreground active:opacity-80 disabled:opacity-50"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      type="button"
      style={{ fontFamily: "Sora, sans-serif" }}
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
