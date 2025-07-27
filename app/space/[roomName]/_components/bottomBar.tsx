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
import { REACTION_EMOJIS } from "@/lib/constants";
import { useClickOutside } from "@/app/hooks/useClickOutside";
import { Track } from "livekit-client";

/**
 * Props for the BottomBar component.
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
 * - Floats above the bottom edge with a glassy, rounded, shadowed look.
 * - All controls are large, touch-friendly, and visually delightful.
 * - Emoji picker is playful, animated, and easy to use.
 * - Sora font, mobile-first, no hover effects.
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

  React.useEffect(() => {
    if (layoutContext?.widget.state?.showChat !== undefined) {
      setIsChatOpen(layoutContext?.widget.state?.showChat);
    }
  }, [layoutContext?.widget.state?.showChat]);

  // Permissions
  const localPermissions = useLocalParticipantPermissions();
  const canPublishMic =
    localPermissions &&
    localPermissions.canPublish &&
    (localPermissions.canPublishSources.length === 0 ||
      localPermissions.canPublishSources.includes(2));

  // Audio input persistence
  const { saveAudioInputEnabled } = usePersistentUserChoices({
    preventSave: true,
  });

  const microphoneOnChange = React.useCallback(
    (enabled: boolean, isUserInitiated: boolean) =>
      isUserInitiated ? saveAudioInputEnabled(enabled) : null,
    [saveAudioInputEnabled],
  );

  // Share handler
  const handleShare = React.useCallback(() => {
    try {
      navigator.clipboard.writeText(
        `${window.location.origin}/space/${roomName}`,
      );
    } catch (err) {
      console.error("[ClipboardError]", err);
    }
  }, [roomName]);

  // Emoji picker state and ref for click outside
  const [emojiOpen, setEmojiOpen] = useState(false);
  const emojiPickerRef = useClickOutside<HTMLDivElement>(() =>
    setEmojiOpen(false),
  );

  // Creative, non-generic emoji bar for quick reactions
  const quickReactions = [
    REACTION_EMOJIS.LIKE,
    REACTION_EMOJIS.LAUGH,
    REACTION_EMOJIS.FIRE,
    REACTION_EMOJIS.HEART,
    REACTION_EMOJIS.CLAP,
  ];

  // Animation for emoji picker
  const [emojiPickerAnim, setEmojiPickerAnim] = useState(false);

  React.useEffect(() => {
    if (emojiOpen) {
      setEmojiPickerAnim(true);
    } else {
      const timeout = setTimeout(() => setEmojiPickerAnim(false), 180);
      return () => clearTimeout(timeout);
    }
  }, [emojiOpen]);

  return (
    <footer
      className={cn(
        "w-full flex flex-col items-center z-50 fixed left-0 right-0 pointer-events-none",
      )}
      style={{ fontFamily: "Sora, sans-serif", bottom: 0 }}
    >
      <div
        className={cn(
          "pointer-events-auto bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-2xl flex flex-col items-center px-6 py-4 rounded-3xl shadow-2xl",
          "mx-auto border border-primary/10",
        )}
        style={{
          maxWidth: 440,
          marginBottom: 32,
          borderRadius: 28,
          boxShadow: "0 12px 40px 0 rgba(0,0,0,0.22)",
          transition: "box-shadow 0.2s cubic-bezier(.4,2,.6,1)",
          position: "relative",
        }}
      >
        <div className="flex w-full justify-between items-center gap-3">
          {canPublishMic ? (
            <BarButton
              label="Mic"
              icon={TrackToggleIcon}
              trackToggleProps={{
                source: "microphone",
                showIcon: true,
                onChange: microphoneOnChange,
                onDeviceError: (error: Error) =>
                  console.error("[MicDeviceError]", error),
              }}
              highlight
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
            label="Tip"
            icon={Square3dFromCenter}
            onClick={onBasedTipClick}
            highlight
          />

          <BarButton label="Share" icon={ShareIcon} onClick={handleShare} />

          {/* Emoji picker trigger */}
          <button
            className={cn(
              "flex flex-col items-center justify-center text-foreground bg-muted/80 rounded-full shadow-lg active:scale-95 transition",
              "w-12 h-12 p-0 border-2 border-primary/20",
              emojiOpen ? "ring-2 ring-primary/60" : "",
            )}
            aria-label="Open emoji reactions"
            type="button"
            style={{
              fontFamily: "Sora, sans-serif",
              fontWeight: 600,
              fontSize: 18,
              boxShadow: emojiOpen
                ? "0 0 0 4px rgba(99,102,241,0.10)"
                : "0 2px 8px 0 rgba(0,0,0,0.10)",
            }}
            onClick={() => setEmojiOpen((v) => !v)}
          >
            <EmojiIcon className="w-7 h-7" />
            <span className="text-[11px] mt-1 font-semibold">React</span>
          </button>
        </div>
        {/* Emoji picker popover */}
        {(emojiOpen || emojiPickerAnim) && (
          <div
            ref={emojiPickerRef}
            className={cn(
              "absolute left-1/2 -translate-x-1/2 bottom-[90px] bg-gradient-to-br from-card/95 to-card/80 rounded-2xl shadow-2xl flex gap-3 px-6 py-4 z-50 border border-primary/10",
              emojiOpen
                ? "opacity-100 scale-100 pointer-events-auto"
                : "opacity-0 scale-95 pointer-events-none",
              "transition-all duration-200 ease-out",
            )}
            style={{
              fontFamily: "Sora, sans-serif",
              minWidth: 250,
              justifyContent: "center",
              alignItems: "center",
              boxShadow: "0 8px 32px 0 rgba(0,0,0,0.18)",
            }}
          >
            {quickReactions.map((emoji, i) => (
              <button
                key={emoji}
                className={cn(
                  "rounded-full bg-primary/10 px-3 py-2 text-2xl shadow-md transition active:scale-90",
                  "border-2 border-primary/20",
                )}
                style={{
                  fontFamily: "Sora, sans-serif",
                  border: "none",
                  outline: "none",
                  fontSize: 28 + i * 2,
                  filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.10))",
                }}
                onClick={() => {
                  onSendReaction(emoji);
                  setEmojiOpen(false);
                }}
                aria-label={`Send ${emoji} reaction`}
                type="button"
              >
                <span
                  style={{
                    display: "inline-block",
                    transform: `scale(${1 + i * 0.05}) rotate(${i % 2 === 0 ? 0 : 2}deg)`,
                    transition: "transform 0.15s",
                  }}
                >
                  {emoji}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </footer>
  );
}

/**
 * BarButton
 * - Large, touch-friendly, creative button for the bottom bar.
 * - Optionally renders a TrackToggle for mic.
 */
interface BarButtonProps {
  label: string;
  icon: React.ElementType;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  highlight?: boolean;
  trackToggleProps?: {
    source: "microphone";
    showIcon: boolean;
    onChange: (enabled: boolean, isUserInitiated: boolean) => void;
    onDeviceError: (error: Error) => void;
  };
}

function BarButton({
  label,
  icon: IconCmp,
  onClick,
  disabled,
  loading,
  highlight,
  trackToggleProps,
}: BarButtonProps) {
  // If TrackToggle, render it with custom styling and required props
  if (trackToggleProps) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center bg-primary/10 rounded-full shadow-lg w-12 h-12",
          highlight ? "ring-2 ring-primary/60" : "",
        )}
        style={{
          fontFamily: "Sora, sans-serif",
          fontWeight: 600,
          fontSize: 18,
        }}
      >
        <TrackToggle
          source={Track.Source.Microphone}
          showIcon={trackToggleProps.showIcon}
          onChange={trackToggleProps.onChange}
          onDeviceError={trackToggleProps.onDeviceError}
          className="w-7 h-7"
          style={{
            color: "#6366f1",
            background: "none",
            border: "none",
            outline: "none",
          }}
        />
        <span className="text-[11px] mt-1 font-semibold">{label}</span>
      </div>
    );
  }
  return (
    <button
      className={cn(
        "flex flex-col items-center justify-center text-foreground bg-muted/80 rounded-full shadow-lg active:scale-95 transition",
        "w-12 h-12 p-0 border-2 border-primary/20",
        highlight ? "ring-2 ring-primary/60" : "",
      )}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      type="button"
      style={{
        fontFamily: "Sora, sans-serif",
        fontWeight: 600,
        fontSize: 18,
        boxShadow: highlight
          ? "0 0 0 4px rgba(99,102,241,0.10)"
          : "0 2px 8px 0 rgba(0,0,0,0.10)",
      }}
    >
      {loading ? (
        <span className="w-7 h-7 flex items-center justify-center">
          <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin inline-block" />
        </span>
      ) : (
        <IconCmp className="w-7 h-7" />
      )}
      <span className="text-[11px] mt-1 font-semibold">{label}</span>
    </button>
  );
}

// Custom icon for TrackToggle (for visual consistency)
function TrackToggleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <span className="w-7 h-7 flex items-center justify-center">
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" {...props}>
        <rect x="6" y="10" width="16" height="8" rx="4" fill="#6366f1" />
        <circle cx="14" cy="14" r="3" fill="#fff" />
      </svg>
    </span>
  );
}
