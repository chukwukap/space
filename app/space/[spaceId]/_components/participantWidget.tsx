import { useMemo } from "react";
import { Participant } from "livekit-client";
import {
  Microphone as MicIcon,
  MicrophoneMute as MicOffIcon,
  User as UserIcon,
} from "iconoir-react";
import { ParticipantMetadata } from "@/lib/types";
import { Role } from "@/lib/generated/prisma";

type ParticipantWidgetProps = {
  p: Participant | undefined;
  pfpUrl?: string;
  roleLabel?: string;
};

export function ParticipantWidget({
  p,
  pfpUrl,
  roleLabel,
}: ParticipantWidgetProps) {
  const meta: ParticipantMetadata = useMemo(() => {
    try {
      return p?.metadata ? JSON.parse(p?.metadata) : {};
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

  return (
    <div className="flex flex-col items-center gap-1" style={{ width: 64 }}>
      <div
        className={`relative flex items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold shadow-lg transition-shadow
        ${roleLabel === Role.HOST ? "border-2 border-amber-400" : ""}
        ${p?.isLocal ? "outline outline-2 outline-cyan-400" : ""}
      `}
        style={{
          width: 64,
          height: 64,
          minWidth: 64,
          minHeight: 64,
          position: "relative",
        }}
        aria-label={`${p?.identity}, ${roleLabel}`}
        tabIndex={0}
      >
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
            {p?.identity || (
              <UserIcon className="w-7 h-7 text-muted-foreground" />
            )}
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
              className={`${"text-muted-foreground"} w-5 h-5 bg-background rounded-full p-0.5 shadow`}
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
      </div>
      {roleLabel && (
        <span className="text-[10px] text-muted-foreground flex items-center gap-1 leading-none">
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
