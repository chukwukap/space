import { useMemo, forwardRef, useContext } from "react";
import { Participant } from "livekit-client";
import {
  Microphone as MicIcon,
  MicrophoneMute as MicOffIcon,
  DragHandGesture,
  CheckCircle,
  XmarkCircle,
} from "iconoir-react";
import { ParticipantMetadata } from "@/lib/types";
import {
  TrackRefContext,
  TrackReferenceOrPlaceholder,
  useLocalParticipant,
  useRoomInfo,
} from "@livekit/components-react";
import Image from "next/image";

/**
 * Props for the CustomParticipantTile component.
 * - reaction: The emoji to display as a reaction overlay (if any).
 */
type ParticipantTileProps = {
  trackRef?: TrackReferenceOrPlaceholder;
  participant?: Participant;
  reaction?: string | null;
};

/**
 * CustomParticipantTile
 *
 * A secure, LiveKit-compatible participant tile for use inside <TrackLoop>.
 * - Shows avatar, mic status, speaking indicator, role, and live reaction overlay.
 * - Host can invite others to speak or demote speakers (secure, only if host/mod).
 * - Security: All actions are permission-checked, and no sensitive errors are leaked to UI.
 *
 * 2025 best practices: Security-first, professional comments, and clear separation of concerns.
 */
export const CustomParticipantTile = forwardRef<
  HTMLDivElement,
  ParticipantTileProps
>(function CustomParticipantTile({ trackRef, participant, reaction }, ref) {
  // Use context if no explicit trackRef is provided
  const contextTrackRef = useContext(TrackRefContext);
  const combinedTrackRef = trackRef ?? contextTrackRef;
  const room = useRoomInfo();

  // Get the participant object (from prop or trackRef)
  const p: Participant | undefined =
    participant ?? combinedTrackRef?.participant;

  // Parse participant metadata safely
  const participantMetadata: ParticipantMetadata | null = useMemo(() => {
    try {
      return JSON.parse(p?.metadata ?? "{}") as ParticipantMetadata;
    } catch {
      return null;
    }
  }, [p]);

  // Get local participant and check if they are host/mod
  const { localParticipant } = useLocalParticipant();
  const isLocalHost = useMemo(() => {
    if (!localParticipant) return false;
    try {
      const localMeta = JSON.parse(
        localParticipant.metadata ?? "{}",
      ) as ParticipantMetadata;
      return !!localMeta?.isHost;
    } catch {
      return false;
    }
  }, [localParticipant]);

  /**
   * Handler to invite a participant to speak.
   * Only available to the host/mod.
   * Security: Only hosts/mods can trigger this, and no sensitive errors are leaked to UI.
   */
  const inviteToSpeak = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLocalHost || !p || !localParticipant) return;

    try {
      // Send inviteToSpeak data message (LiveKit data channel, reliable)
      localParticipant.publishData(
        new TextEncoder().encode(
          JSON.stringify({
            type: "inviteToSpeak",
            sid: p.sid,
            timestamp: Date.now(),
          }),
        ),
        { reliable: true },
      );
      // Call backend API to update permissions
      await fetch("/api/room/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomName: room.name,
          identity: p.identity,
        }),
      });
    } catch (err) {
      // Security: Log error for audit, but do not leak details to UI
      console.error("[InviteToSpeak] failed", err);
    }
  };

  /**
   * Handler to demote a speaker to listener.
   * Only available to the host/mod.
   * Security: Only hosts/mods can trigger this, and no sensitive errors are leaked to UI.
   */
  const demoteSpeaker = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLocalHost || !p || !localParticipant) return;

    try {
      // Optionally, send demoteToListener data message (LiveKit data channel, reliable)
      // localParticipant.publishData(
      //   new TextEncoder().encode(
      //     JSON.stringify({
      //       type: "demoteToListener",
      //       sid: p.sid,
      //       timestamp: Date.now(),
      //     }),
      //   ),
      //   { reliable: true },
      // );
      // Call backend API to update permissions
      await fetch("/api/room/demote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomName: room.name,
          identity: p.identity,
        }),
      });
    } catch (err) {
      // Security: Log error for audit, but do not leak details to UI
      console.error("[DemoteToListener] failed", err);
    }
  };

  return (
    <div
      ref={ref}
      className="flex flex-col items-center gap-1"
      style={{ width: 64 }}
    >
      <div
        className="relative flex items-center justify-center rounded-full text-primary-foreground font-semibold shadow-lg transition-shadow"
        style={{
          width: 64,
          height: 64,
          minWidth: 64,
          minHeight: 64,
          position: "relative",
        }}
        aria-label={`${p?.identity}, ${
          participantMetadata?.isHost &&
          p?.identity &&
          participantMetadata.isHost
            ? "Host"
            : "Listener"
        }`}
        tabIndex={0}
      >
        <Image
          src={
            participantMetadata?.fcContext?.farcasterUser?.pfpUrl ??
            "/images/default-avatar.png"
          }
          alt={p?.identity ?? "Participant"}
          className="object-cover w-full h-full rounded-full"
          width={64}
          height={64}
          draggable={false}
          priority
          unoptimized
        />

        {/* Show mic status only for participants who have publish permission */}
        {p?.permissions?.canPublish && (
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
                className="text-muted-foreground w-5 h-5 bg-background rounded-full p-0.5 shadow"
                aria-label="Mic On"
              />
            )}
          </span>
        )}

        {/* Speaking indicator (animated bars) */}
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

        {/* Highlight local participant */}
        {p?.isLocal && (
          <span className="absolute inset-0 rounded-full ring-2 ring-cyan-400 pointer-events-none animate-pulse" />
        )}

        {/* Host/Mod controls: Only visible to host/mod, not for self or other hosts */}
        {isLocalHost && !participantMetadata?.isHost && !p?.isLocal && (
          <>
            {/* Show "Invite to Speak" button for listeners */}
            {!p?.permissions?.canPublish && (
              <button
                onClick={inviteToSpeak}
                className="absolute -bottom-2 left-1 bg-background rounded-full shadow p-0.5"
                title="Invite to Speak"
                aria-label="Invite to Speak"
              >
                <CheckCircle className="w-4 h-4 text-emerald-500" />
              </button>
            )}
            {/* Show "Demote" (X) button for speakers */}
            {p?.permissions?.canPublish && (
              <button
                onClick={demoteSpeaker}
                className="absolute -bottom-2 left-1 bg-background rounded-full shadow p-0.5"
                title="Demote to Listener"
                aria-label="Demote to Listener"
              >
                <XmarkCircle className="w-4 h-4 text-rose-500" />
              </button>
            )}
          </>
        )}

        {/* Hand raise indicator (if participant has raised hand) */}
        {participantMetadata?.handRaised && (
          <span
            className="absolute -top-2 -left-2 bg-background rounded-full shadow p-0.5"
            title="Hand raised"
          >
            <DragHandGesture className="w-4 h-4 text-amber-500" />
          </span>
        )}

        {/* --- REACTION OVERLAY --- */}
        {reaction && (
          <span
            className="absolute -top-4 left-1/2 -translate-x-1/2 z-30 animate-reaction-pop"
            style={{
              fontSize: 32,
              filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.18))",
              pointerEvents: "none",
              userSelect: "none",
            }}
            aria-label="Reaction"
          >
            {reaction}
          </span>
        )}
      </div>
      <span className="text-[10px] text-muted-foreground flex items-center gap-1 leading-none">
        <span
          className={`inline-block w-1 h-1 rounded-full ${
            p?.isSpeaking ? "bg-secondary" : "bg-muted-foreground"
          }`}
        />
        {participantMetadata?.isHost
          ? "Host"
          : p?.permissions?.canPublish
            ? "Speaker"
            : "Listener"}
      </span>
      <style jsx global>{`
        @keyframes reaction-pop {
          0% {
            transform: scale(0.7) translateY(10px);
            opacity: 0;
          }
          20% {
            transform: scale(1.2) translateY(-4px);
            opacity: 1;
          }
          80% {
            transform: scale(1) translateY(-2px);
            opacity: 1;
          }
          100% {
            transform: scale(0.7) translateY(-10px);
            opacity: 0;
          }
        }
        .animate-reaction-pop {
          animation: reaction-pop 2.5s cubic-bezier(0.4, 0.8, 0.2, 1) both;
        }
      `}</style>
    </div>
  );
});
