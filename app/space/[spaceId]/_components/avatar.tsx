/**
 * AvatarWithControls component
 * Renders a participant's avatar with Twitter Spaces-style controls (mic, mute, hand, etc).
 * Optimized for accessibility, clarity, and modern UI/UX.
 *
 * @param p - LiveKit Participant
 * @param size - Avatar size in px
 * @param isHost - Is this participant the host?
 * @param isSpeaking - Is the participant currently speaking?
 * @param isHandRaised - Has the participant raised their hand?
 * @param pfpUrl - Optional profile photo URL
 */
import { useMemo } from "react";
import { Participant } from "livekit-client";
import {
  Microphone as MicIcon,
  MicrophoneMute as MicOffIcon,
  HandContactless as HandIcon, // placeholder for hand icon
  User as UserIcon,
  PlusCircle as InviteIcon,
  MicrophoneMute as MuteRemoteIcon,
  Microphone as UnmuteRemoteIcon,
  RulerMinus as DemoteIcon,
} from "iconoir-react";

type AvatarWithControlsProps = {
  /** LiveKit participant instance */
  p: Participant | undefined;
  /** Display a golden ring and "Host" label */
  isHost?: boolean;
  /** Highlight avatar as the local user */
  isLocal?: boolean;
  /** Custom profile-photo URL (overrides metadata) */
  pfpUrl?: string;
  /** Callback for host to invite this participant to speak */
  onInvite?: () => void;
  /** Host control: mute / unmute a remote speaker */
  onToggleRemoteMute?: () => void;
  /** Host control: demote speaker to listener */
  onDemote?: () => void;
  /** Label to show underneath the avatar e.g. "Host" */
  roleLabel?: string;
  /** Avatar diameter in pixels. Defaults to 64 px. */
  size?: number;
};

export function AvatarWithControls({
  p,
  isHost = false,
  isLocal = false,
  pfpUrl,
  onInvite,
  onToggleRemoteMute,
  onDemote,
  roleLabel,
  size = 64,
}: AvatarWithControlsProps) {
  // Memoize meta to avoid unnecessary recalculations and to ensure stable reference for useMemo dependencies
  const meta = useMemo(() => {
    try {
      return p?.metadata ? JSON.parse(p?.metadata) : {};
    } catch {
      // Defensive: If metadata is malformed, return empty object
      return {};
    }
  }, [p?.metadata]);

  // Derive initials if no photo
  const initials = useMemo(() => {
    if (!p?.name) return "";
    const parts = p?.name?.split(" ");
    if (parts?.length === 1) return parts[0]?.slice(0, 2)?.toUpperCase();
    return (parts[0]?.[0] + parts[1]?.[0])?.toUpperCase();
  }, [p?.name]);

  // Fallback: use participant metadata for photo if available
  const avatarUrl = useMemo(() => {
    if (pfpUrl) return pfpUrl;
    if (!meta?.pfpUrl) return undefined;
    try {
      return meta.pfpUrl;
    } catch {
      return undefined;
    }
  }, [pfpUrl, meta]);

  // Accessibility: Compose label
  const ariaLabel = [p?.identity, isHost ? "host" : "", isLocal ? "you" : ""]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="flex flex-col items-center gap-1" style={{ width: size }}>
      <div
        className={`relative flex items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold shadow-lg transition-shadow
        ${isHost ? "border-2 border-amber-400" : ""}
        ${p?.isLocal ? "outline outline-2 outline-cyan-400" : ""}
      `}
        style={{
          width: size,
          height: size,
          minWidth: size,
          minHeight: size,
          position: "relative",
        }}
        aria-label={ariaLabel}
        tabIndex={0}
      >
        {/* Avatar image or initials */}
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={p?.identity}
            className="object-cover w-full h-full rounded-full"
            draggable={false}
            loading="lazy"
          />
        ) : (
          <span className="relative z-10 select-none text-lg flex items-center justify-center w-full h-full">
            {initials || <UserIcon className="w-7 h-7 text-muted-foreground" />}
          </span>
        )}

        {/* Hand raise */}
        {meta.handRaised && (
          <span
            className="absolute -top-2 -left-2 z-20 drop-shadow"
            title="Hand Raised"
          >
            <HandIcon className="w-5 h-5 text-secondary bg-background rounded-full p-0.5" />
          </span>
        )}

        {/* Mic/mute indicator */}
        <span
          className="absolute -bottom-2 right-1 z-20"
          title={p?.isMicrophoneEnabled ? "Mic On" : "Mic Off"}
        >
          {!p?.isMicrophoneEnabled ? (
            <MicOffIcon
              className="w-5 h-5 text-destructive bg-background rounded-full p-0.5 shadow"
              aria-label="Muted"
            />
          ) : (
            <MicIcon
              className={`${"text-muted-foreground"} w-5 h-5 bg-background rounded-full p-0.5 shadow`}
              aria-label="Mic On"
            />
          )}
        </span>

        {/* Speaking equalizer */}
        {p?.isSpeaking && p?.isMicrophoneEnabled && (
          <span className="absolute -right-2 bottom-1 flex flex-col items-center gap-[2px]">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="eq-bar"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </span>
        )}

        {/* Invite to speak button */}
        {onInvite && (
          <button
            onClick={onInvite}
            className="absolute -bottom-2 -left-2 z-20 bg-white rounded-full p-0.5 shadow hover:scale-105 transition-transform"
            title="Invite to Speak"
          >
            <InviteIcon className="w-5 h-5 text-primary" />
          </button>
        )}

        {/* Host moderation controls (mute/unmute, demote) */}
        {onToggleRemoteMute && (
          <button
            onClick={onToggleRemoteMute}
            className="absolute -top-2 -right-2 z-20 bg-white rounded-full p-0.5 shadow hover:scale-105 transition-transform"
            title={p?.isMicrophoneEnabled ? "Unmute Speaker" : "Mute Speaker"}
          >
            {!p?.isMicrophoneEnabled ? (
              <UnmuteRemoteIcon className="w-5 h-5 text-destructive" />
            ) : (
              <MuteRemoteIcon className="w-5 h-5 text-red-600" />
            )}
          </button>
        )}

        {onDemote && (
          <button
            onClick={onDemote}
            className="absolute -top-2 -left-2 z-20 bg-white rounded-full p-0.5 shadow hover:scale-105 transition-transform"
            title="Move to Listener"
          >
            <DemoteIcon className="w-5 h-5 text-amber-400" />
          </button>
        )}

        {/* Tip button removed */}

        {/* Local user highlight ring */}
        {p?.isLocal && (
          <span className="absolute inset-0 rounded-full ring-2 ring-cyan-400 pointer-events-none animate-pulse" />
        )}
      </div>
      {roleLabel && (
        <span className="text-[10px] text-muted-foreground flex items-center gap-1 leading-none">
          {/* Bullet */}
          <span
            className={`inline-block w-1 h-1 rounded-full ${
              p?.isSpeaking ? "bg-secondary" : "bg-muted-foreground"
            }`}
          />
          {roleLabel}
        </span>
      )}
    </div>
  );
}
