"use client";

import {
  LiveKitRoom,
  useToken,
  RoomAudioRenderer,
} from "@livekit/components-react";
import { useMemo, useState } from "react";
import "@livekit/components-styles";
import dynamic from "next/dynamic";

import MobileHeader from "@/app/_components/mobileHeader";
import { ParticipantMetadata, SpaceWithHostParticipant } from "@/lib/types";
import { useUser } from "@/app/providers/userProvider";

import { NEXT_PUBLIC_LK_SERVER_URL } from "@/lib/constants";
import SpaceLayout from "./spaceLayout";

const InviteDrawer = dynamic(() => import("@/app/_components/inviteDrawer"), {
  ssr: false,
});

export default function SpaceRoom({
  space,
}: {
  space: SpaceWithHostParticipant;
}) {
  const { user } = useUser();

  const userInfo = useMemo(
    () => ({
      identity: user?.id.toString(),
      name: user?.username ?? undefined,
      metadata: JSON.stringify({
        userDbId: user?.id ?? null,
        pfpUrl: user?.avatarUrl ?? null,
        fid: user?.fid ?? null,
        walletAddress: user?.address ?? null,
        handRaised: false,
      } as ParticipantMetadata),
    }),
    [user],
  );

  const localParticipantToken = useToken("/api/token", space.livekitName, {
    userInfo,
  });

  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <>
      <MobileHeader showBack />
      <LiveKitRoom
        token={localParticipantToken}
        serverUrl={NEXT_PUBLIC_LK_SERVER_URL}
        video={false}
        screen={false}
        audio={true}
        connect={true}
        connectOptions={{
          autoSubscribe: true,
        }}
        onConnected={() => {
          console.log("connected");
        }}
        onDisconnected={(r) => {
          console.log("disconnected", r);
        }}
        onError={(e) => {
          console.log("error", e);
        }}
        options={
          {
            // disconnectOnPageLeave: true,
          }
        }
      >
        <SpaceLayout onInviteClick={() => setInviteOpen(true)} space={space} />

        {inviteOpen && (
          <InviteDrawer
            people={[]}
            defaultOpen={true}
            onSend={() => setInviteOpen(false)}
          />
        )}
        <RoomAudioRenderer />
      </LiveKitRoom>
    </>
  );
}
