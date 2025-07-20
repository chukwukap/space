"use client";

import {
  LiveKitRoom,
  useToken,
  RoomAudioRenderer,
} from "@livekit/components-react";
import { useState } from "react";
import "@livekit/components-styles";
import dynamic from "next/dynamic";

import MobileHeader from "@/app/_components/mobileHeader";
import { SpaceMetadata } from "@/lib/types";
import { useUser } from "@/app/providers/userProvider";

import { NEXT_PUBLIC_LK_SERVER_URL } from "@/lib/constants";
import SpaceLayout from "./spaceLayout";
import { Room } from "livekit-server-sdk";

const InviteDrawer = dynamic(() => import("@/app/_components/inviteDrawer"), {
  ssr: false,
});

export default function SpaceRoom({
  serverRoom,
  title,
  roomMetadata,
}: {
  serverRoom: Room;
  title: string;
  roomMetadata: SpaceMetadata;
}) {
  const { userMetadata } = useUser();

  const localParticipantToken = useToken("/api/token", serverRoom.name, {
    userInfo: {
      identity: userMetadata?.fid?.toString() ?? "",
      name: userMetadata?.displayName ?? userMetadata?.username ?? "Guest",
      metadata: JSON.stringify(userMetadata),
    },
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
        options={{
          disconnectOnPageLeave: true,
        }}
      >
        <SpaceLayout
          onInviteClick={() => setInviteOpen(true)}
          roomMetadata={roomMetadata}
        />

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
