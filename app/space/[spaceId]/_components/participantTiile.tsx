import { useMemo, forwardRef, useContext } from "react";
import { Participant } from "livekit-client";
import {
  Microphone as MicIcon,
  MicrophoneMute as MicOffIcon,
  User as UserIcon,
  DragHandGesture,
  CheckCircle,
} from "iconoir-react";
import { ParticipantMetadata, SpaceMetadata } from "@/lib/types";
import {
  TrackRefContext,
  TrackReferenceOrPlaceholder,
  useRoomInfo,
  useLocalParticipant,
} from "@livekit/components-react";

type ParticipantTileProps = {
  trackRef?: TrackReferenceOrPlaceholder;
  pfpUrl?: string;
};

/**
 * LiveKit-compatible custom participant tile for use inside <TrackLoop>
 */
export const CustomParticipantTile = forwardRef<
  HTMLDivElement,
  ParticipantTileProps
>(function CustomParticipantTile({ trackRef, pfpUrl }, ref) {
  const contextTrackRef = useContext(TrackRefContext);
  const combinedTrackRef = trackRef ?? contextTrackRef;
  const roomInfo = useRoomInfo();

  const roomMeta: SpaceMetadata = useMemo(() => {
    try {
      return JSON.parse(roomInfo?.metadata ?? "{}");
    } catch {
      return {};
    }
  }, [roomInfo]);

  const p: Participant | undefined = combinedTrackRef?.participant;

  const isHost = useMemo(() => {
    return (
      roomMeta.host?.identity &&
      p?.identity &&
      roomMeta.host?.identity === parseInt(p?.identity)
    );
  }, [roomMeta, p]);

  const meta: ParticipantMetadata = useMemo(() => {
    try {
      return p?.metadata ? JSON.parse(p.metadata) : {};
    } catch {
      return {};
    }
  }, [p?.metadata]);

  const avatarUrl = useMemo(() => {
    if (pfpUrl) return pfpUrl;
    if (!meta?.pfpUrl) return undefined;
    try {
      return meta.pfpUrl;
    } catch {
      return undefined;
    }
  }, [pfpUrl, meta]);

  // Determine if the local user (viewer) is the host
  const { localParticipant } = useLocalParticipant();

  const isLocalHost = useMemo(() => {
    if (!localParticipant) return false;
    try {
      const localMeta = localParticipant.metadata
        ? JSON.parse(localParticipant.metadata)
        : {};
      return !!localMeta.isHost;
    } catch {
      return false;
    }
  }, [localParticipant]);

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
        className={`relative flex items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold shadow-lg transition-shadow
          ${isHost ? "border-2 border-amber-400" : ""}
          ${p?.isLocal ? "outline outline-2 outline-cyan-400" : ""}
        `}
        style={{
          width: 64,
          height: 64,
          minWidth: 64,
          minHeight: 64,
          position: "relative",
        }}
        aria-label={`${p?.identity}, ${roomMeta.host?.identity && p?.identity && roomMeta.host?.identity === parseInt(p?.identity) ? "Host" : "Listener"}`}
        tabIndex={0}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={p?.identity}
            className="object-cover w-full h-full rounded-full"
            draggable={false}
            loading="lazy"
          />
        ) : (
          <span className="relative z-10 select-none text-lg flex items-center justify-center w-full h-full">
            <UserIcon className="w-7 h-7 text-muted-foreground" />
          </span>
        )}

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
        {isLocalHost && meta?.handRaised && !p?.isLocal && (
          <button
            onClick={inviteToSpeak}
            className="absolute -bottom-2 left-1 bg-background rounded-full shadow p-0.5"
            title="Invite to Speak"
          >
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </button>
        )}

        {/* Hand raise indicator */}
        {meta?.handRaised && (
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
        {isHost ? "Host" : p?.isMicrophoneEnabled ? "Speaker" : "Listener"}
      </span>
    </div>
  );
});
