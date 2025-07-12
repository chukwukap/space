"use client";

import {
  LiveKitRoom,
  RoomAudioRenderer,
  useRoomContext,
  useToken,
} from "@livekit/components-react";
import { Participant } from "livekit-client";
import "@livekit/components-styles";
import dynamic from "next/dynamic";
import { AvatarWithControls } from "./avatar";
import { useState } from "react";
import { useUser } from "@/app/providers/userProvider";
import { useRouter } from "next/navigation";
const InviteSheet = dynamic(() => import("./inviteSheet"), { ssr: false });
const ConfirmDialog = dynamic(() => import("./confirmDialog"), { ssr: false });

interface SpaceRoomProps {
  serverUrl: string;
  title?: string;
  spaceId: string;
}

function SpaceLayout() {
  const room = useRoomContext();
  const router = useRouter();
  const host = room.localParticipant;
  const activeSpeakers = room.activeSpeakers;
  const remoteParticipants = Array.from(room.remoteParticipants.values());
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const speakers = remoteParticipants.filter((p) => activeSpeakers.includes(p));
  const listeners = remoteParticipants.filter(
    (p) => !activeSpeakers.includes(p),
  );

  return (
    <div className=" gap-4 min-h-screen bg-gray-950">
      <header className="flex justify-between px-4 py-2 bg-black/80 backdrop-blur z-50">
        <div className="flex items-center gap-3">
          <span className="bg-red-600/90 rounded px-1.5 py-0.5 text-[10px] font-semibold">
            REC
          </span>
          <button className="text-2xl">•••</button>
        </div>

        <button
          className="text-red-500 font-semibold"
          onClick={() => setConfirmDialogOpen(true)}
        >
          Leave
        </button>
      </header>
      {/* Title */}

      <h1 className="px-6  text-lg font-bold leading-snug mt-4">
        Will Pump.fun TGE Suck Solana&apos;s Liquidity? Or it&apos;s Letsbonk
        Meta now?
      </h1>

      <div className="flex px-6 py-4 gap-4">
        {/* Host */}
        <AvatarWithControls p={host as Participant} size={56} />
        {/* Speakers */}
        {speakers.map((s) => (
          <AvatarWithControls key={s.identity} p={s as Participant} size={56} />
        ))}
        {/* Listeners */}
        {listeners.map((l) => (
          <AvatarWithControls key={l.identity} p={l as Participant} size={56} />
        ))}
      </div>

      {confirmDialogOpen && (
        <ConfirmDialog
          title="Leave Room"
          subtitle="Are you sure you want to leave the room?"
          confirmLabel="Leave"
          onCancel={() => setConfirmDialogOpen(false)}
          onConfirm={() => {
            try {
              // Gracefully disconnect from the LiveKit room before navigating away.
              room?.disconnect();
            } catch (err) {
              // eslint-disable-next-line no-console
              console.error("Error disconnecting from room", err);
            } finally {
              // Navigate the user back to the landing page.
              router.push("/");
            }
          }}
        />
      )}
    </div>
  );
}

/**
 * SpaceRoom renders the LiveKit UI and connects the user to the provided room.
 * SECURITY: The token is generated server-side and passed as a prop. Do not
 * expose your LiveKit API key/secret on the client.
 */
export default function SpaceRoom({ serverUrl, spaceId }: SpaceRoomProps) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const user = useUser();
  console.log("user", user);

  const token = useToken(
    process.env.NEXT_PUBLIC_LK_TOKEN_ENDPOINT || "/api/livekit/token",
    spaceId,
    {
      userInfo: {
        identity: user?.user?.id.toString() ?? "testIdentity",
        name: user?.user?.username ?? "testUserName",
      },
    },
  );

  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      data-lk-theme="default"
      connectOptions={{ autoSubscribe: true }}
      options={{
        audioCaptureDefaults: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 2,
          sampleRate: 48000,
          sampleSize: 16,
          latency: 100,
        },
      }}
      style={{ height: "100vh", width: "100%" }}
      simulateParticipants={4}
      video={false}
      audio={false}
    >
      <SpaceLayout />
      {inviteOpen && <InviteSheet onClose={() => setInviteOpen(false)} />}
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}
