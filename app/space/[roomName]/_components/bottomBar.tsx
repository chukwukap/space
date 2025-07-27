"use client";

import React, { useState } from "react";
import {
  ShareAndroid as ShareIcon,
  Square3dFromCenter,
  MicrophoneMuteSolid,
  CheckCircle,
  Emoji as EmojiIcon,
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
import { useClickOutside } from "@/app/hooks/useClickOutside";

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
 * The persistent bottom bar for the Sonic Space room.
 * - Floats above the bottom edge with rounded corners.
 * - Shows mic toggle or "Request to Speak" depending on permissions.
 * - Provides quick access to tipping, reactions, sharing, and emoji picker.
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

  // Emoji picker state and ref for click outside
  const [emojiOpen, setEmojiOpen] = useState(false);
  const emojiPickerRef = useClickOutside<HTMLDivElement>(() =>
    setEmojiOpen(false),
  );

  return (
    <footer
      className={cn(
        "w-full flex flex-col items-center z-50 fixed left-0 right-0 pointer-events-none",
      )}
      style={{ fontFamily: "Sora, sans-serif", bottom: 0 }}
    >
      <div
        className={cn(
          "pointer-events-auto bg-card/80 backdrop-blur-lg flex flex-col items-center px-4 py-3 rounded-2xl shadow-xl",
          "mx-auto",
        )}
        style={{
          maxWidth: 420,
          marginBottom: 24,
          borderRadius: 24,
          boxShadow: "0 8px 32px 0 rgba(0,0,0,0.18)",
        }}
      >
        <div className="flex w-full justify-around items-center gap-2">
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

          {/* Emoji picker trigger */}
          <button
            className="flex flex-col items-center text-foreground active:opacity-80 disabled:opacity-50"
            aria-label="Open emoji reactions"
            type="button"
            style={{ fontFamily: "Sora, sans-serif" }}
            onClick={() => setEmojiOpen((v) => !v)}
          >
            <EmojiIcon className="w-6 h-6" />
            <span className="text-[10px] mt-1">Reactions</span>
          </button>
        </div>
        {/* Emoji picker popover */}
        {emojiOpen && (
          <div
            ref={emojiPickerRef}
            className="absolute left-1/2 -translate-x-1/2 bottom-[70px] bg-card/95 rounded-xl shadow-lg flex gap-2 px-4 py-3 z-50"
            style={{
              fontFamily: "Sora, sans-serif",
              minWidth: 220,
              justifyContent: "center",
              alignItems: "center",
              pointerEvents: "auto",
            }}
          >
            {quickReactions.map((emoji) => (
              <button
                key={emoji}
                className="rounded-full bg-muted px-2 py-1 text-xl shadow transition active:scale-95"
                style={{
                  fontFamily: "Sora, sans-serif",
                  border: "none",
                  outline: "none",
                }}
                onClick={() => {
                  onSendReaction(emoji);
                  setEmojiOpen(false);
                }}
                aria-label={`Send ${emoji} reaction`}
                type="button"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
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
