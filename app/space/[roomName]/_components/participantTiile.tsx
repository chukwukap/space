import { useMemo, forwardRef, useContext, useState } from "react";
import { Participant } from "livekit-client";
import {
  Microphone as MicIcon,
  MicrophoneMute as MicOffIcon,
  DragHandGesture,
  CheckCircle,
} from "iconoir-react";
import { ParticipantMetadata } from "@/lib/types";
import {
  TrackRefContext,
  TrackReferenceOrPlaceholder,
  useRoomInfo,
  useLocalParticipant,
} from "@livekit/components-react";
import Image from "next/image";

type ParticipantTileProps = {
  trackRef?: TrackReferenceOrPlaceholder;
  participant?: Participant;
};

/**
 * LiveKit-compatible custom participant tile for use inside <TrackLoop>
 */
export const CustomParticipantTile = forwardRef<
  HTMLDivElement,
  ParticipantTileProps
>(function CustomParticipantTile({ trackRef, participant }, ref) {
  const contextTrackRef = useContext(TrackRefContext);
  const combinedTrackRef = trackRef ?? contextTrackRef;
  const roomInfo = useRoomInfo();
  const [metadata] = useState<ParticipantMetadata | null>(() => {
    try {
      return JSON.parse(participant?.metadata ?? "{}") as ParticipantMetadata;
    } catch {
      return null;
    }
  });

  console.log("[CustomParticipantTile] metadata", metadata);
  console.log("[CustomParticipantTile] participant", participant);
  console.log("[CustomParticipantTile] combinedTrackRef", combinedTrackRef);

  // Parse participant metadata using the safe utility
  const participantMetadata: ParticipantMetadata | null = useMemo(() => {
    let meta: ParticipantMetadata | null = null;

    try {
      meta = JSON.parse(participant?.metadata ?? "{}") as ParticipantMetadata;
    } catch {
      return null;
    }

    return meta;
  }, [participant]);

  const p: Participant | undefined =
    participant ?? combinedTrackRef?.participant;

  // Determine if the local user (viewer) is the host
  const { localParticipant } = useLocalParticipant();

  // Use the safe JSON utility for local participant metadata as well
  const isLocalHost = useMemo(() => {
    if (!localParticipant) return false;
    const localMeta = JSON.parse(
      localParticipant.metadata ?? "{}",
    ) as ParticipantMetadata;
    return !!localMeta?.isHost;
  }, [localParticipant]);

  /**
   * Handler to invite a participant to speak.
   * Only available to the host.
   */
  const inviteToSpeak = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLocalHost || !p || !localParticipant) return;

    try {
      // Send inviteSpeak data message
      localParticipant.publishData(
        new TextEncoder().encode(
          JSON.stringify({ type: "inviteSpeak", sid: p.sid }),
        ),
        { reliable: true },
      );

      // Call server to update permissions
      await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomName: roomInfo?.name,
          identity: p.identity,
        }),
      });
    } catch (err) {
      // Security: Do not leak sensitive error details to the UI
      console.error("[InviteToSpeak] failed", err);
    }
  };

  return (
    <div
      ref={ref}
      className="flex flex-col items-center gap-1"
      style={{ width: 64 }}
    >
      <div
        className={`relative flex items-center justify-center rounded-full text-primary-foreground font-semibold shadow-lg transition-shadow`}
        style={{
          width: 64,
          height: 64,
          minWidth: 64,
          minHeight: 64,
          position: "relative",
        }}
        aria-label={`${p?.identity}, ${participantMetadata?.isHost && p?.identity && participantMetadata.isHost ? "Host" : "Listener"}`}
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

        {p?.isLocal && (
          <span className="absolute inset-0 rounded-full ring-2 ring-cyan-400 pointer-events-none animate-pulse" />
        )}

        {/* Accept request button for host */}
        {isLocalHost && participantMetadata?.isHost && !p?.isLocal && (
          <button
            onClick={inviteToSpeak}
            className="absolute -bottom-2 left-1 bg-background rounded-full shadow p-0.5"
            title="Invite to Speak"
          >
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </button>
        )}

        {/* Hand raise indicator */}
        {participantMetadata?.isHost && (
          <span
            className="absolute -top-2 -left-2 bg-background rounded-full shadow p-0.5"
            title="Hand raised"
          >
            <DragHandGesture className="w-4 h-4 text-amber-500" />
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
    </div>
  );
});
