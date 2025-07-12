/**
 * AvatarWithControls component
 * Renders a participant's avatar with Twitter Spaces-style controls (mic, mute, hand, etc).
 * Optimized for accessibility, clarity, and modern UI/UX.
 *
 * @param p - LiveKit Participant
 * @param size - Avatar size in px
 * @param isHost - Is this participant the host?
 * @param isLocal - Is this the local user?
 * @param isMuted - Is the participant muted?
 * @param isSpeaking - Is the participant currently speaking?
 * @param isHandRaised - Has the participant raised their hand?
 * @param photoUrl - Optional profile photo URL
 */
import { useMemo } from "react";
import { Participant } from "livekit-client";
import {
  Mic2 as MicIcon,
  MicOff as MicOffIcon,
  HandMetal as HandIcon,
  Crown as CrownIcon,
  User as UserIcon,
  PlusCircle as InviteIcon,
} from "lucide-react";

type AvatarWithControlsProps = {
  p: Participant;
  size?: number;
  isHost?: boolean;
  isLocal?: boolean;
  isMuted?: boolean;
  isSpeaking?: boolean;
  isHandRaised?: boolean;
  photoUrl?: string;
  /** Callback for host to invite this participant to speak */
  onInvite?: () => void;
};

export function AvatarWithControls({
  p,
  size = 64,
  isHost = false,
  isLocal = false,
  isMuted,
  isSpeaking,
  isHandRaised,
  photoUrl,
  onInvite,
}: AvatarWithControlsProps) {
  // Derive initials if no photo
  const initials = useMemo(() => {
    if (!p.identity) return "";
    const parts = p.identity.split(" ");
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }, [p.identity]);

  // Fallback: use participant metadata for photo if available
  const avatarUrl = useMemo(() => {
    if (photoUrl) return photoUrl;
    try {
      const meta = p.metadata ? JSON.parse(p.metadata) : {};
      return meta.photoUrl || undefined;
    } catch {
      return undefined;
    }
  }, [photoUrl, p.metadata]);

  // Determine mute state securely
  const muted =
    typeof isMuted === "boolean"
      ? isMuted
      : typeof (p as Participant).isMicrophoneEnabled === "boolean"
        ? !(p as Participant).isMicrophoneEnabled
        : false;

  // Determine speaking state
  const speaking =
    typeof isSpeaking === "boolean"
      ? isSpeaking
      : typeof (p as Participant).isSpeaking === "boolean"
        ? (p as Participant).isSpeaking
        : false;

  // Hand raise state
  const handRaised = useMemo(() => {
    if (typeof isHandRaised === "boolean") return isHandRaised;
    try {
      const meta = p.metadata ? JSON.parse(p.metadata) : {};
      return !!meta.handRaised;
    } catch {
      return false;
    }
  }, [isHandRaised, p.metadata]);

  // Accessibility: Compose label
  const ariaLabel = [
    p.identity,
    isHost ? "host" : "",
    isLocal ? "you" : "",
    muted ? "muted" : "unmuted",
    speaking ? "speaking" : "",
    handRaised ? "hand raised" : "",
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div
      className={`relative flex items-center justify-center rounded-full bg-gradient-to-br from-violet-700 via-purple-700 to-violet-900 text-white font-semibold shadow-lg transition-shadow
        ${speaking ? "ring-4 ring-violet-400/80 shadow-2xl" : ""}
        ${isHost ? "border-2 border-yellow-400" : ""}
        ${isLocal ? "outline outline-2 outline-cyan-400" : ""}
      `}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        boxShadow: speaking
          ? "0 0 0 4px rgba(139,92,246,0.3), 0 4px 24px 0 rgba(80,0,120,0.18)"
          : "0 2px 8px 0 rgba(80,0,120,0.10)",
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
          alt={p.identity}
          className="object-cover w-full h-full rounded-full"
          draggable={false}
          loading="lazy"
        />
      ) : (
        <span className="relative z-10 select-none text-lg flex items-center justify-center w-full h-full">
          {initials || <UserIcon className="w-7 h-7 text-gray-300" />}
        </span>
      )}

      {/* Host crown */}
      {isHost && (
        <span
          className="absolute -top-2 -right-2 z-20 drop-shadow"
          title="Host"
        >
          <CrownIcon className="w-5 h-5 text-yellow-400 bg-white rounded-full p-0.5" />
        </span>
      )}

      {/* Hand raise */}
      {handRaised && (
        <span
          className="absolute -top-2 -left-2 z-20 drop-shadow"
          title="Hand Raised"
        >
          <HandIcon className="w-5 h-5 text-blue-400 bg-white rounded-full p-0.5" />
        </span>
      )}

      {/* Mic/mute indicator */}
      <span
        className="absolute -bottom-2 right-1 z-20"
        title={muted ? "Muted" : "Mic On"}
      >
        {muted ? (
          <MicOffIcon
            className="w-5 h-5 text-red-500 bg-white rounded-full p-0.5 shadow"
            aria-label="Muted"
          />
        ) : (
          <MicIcon
            className={`w-5 h-5 ${
              speaking ? "text-green-400" : "text-gray-300"
            } bg-white rounded-full p-0.5 shadow`}
            aria-label="Mic On"
          />
        )}
      </span>

      {/* Invite to speak button (visible to host when participant has hand raised) */}
      {onInvite && (
        <button
          onClick={onInvite}
          className="absolute -bottom-2 -left-2 z-20 bg-white rounded-full p-0.5 shadow hover:scale-105 transition-transform"
          title="Invite to Speak"
        >
          <InviteIcon className="w-5 h-5 text-violet-600" />
        </button>
      )}

      {/* Local user highlight ring */}
      {isLocal && (
        <span className="absolute inset-0 rounded-full ring-2 ring-cyan-400 pointer-events-none animate-pulse" />
      )}
    </div>
  );
}
