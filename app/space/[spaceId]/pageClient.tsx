"use client";

import {
  LiveKitRoom,
  useToken,
  RoomAudioRenderer,
  LocalUserChoices,
  PreJoin,
} from "@livekit/components-react";
import React, { useState } from "react";
import { generateUsername } from "@/lib/utils";
import "@livekit/components-styles";
import dynamic from "next/dynamic";

import MobileHeader from "@/app/_components/mobileHeader";
import { ConnectionDetails, SpaceMetadata } from "@/lib/types";
import { useUser } from "@/app/providers/userProvider";

import { NEXT_PUBLIC_LK_SERVER_URL } from "@/lib/constants";
import SpaceLayout from "./_components/TipSpaceRoom";
import { Room } from "livekit-server-sdk";

const InviteDrawer = dynamic(() => import("@/app/_components/inviteDrawer"), {
  ssr: false,
});

const CONN_DETAILS_ENDPOINT =
  process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT ?? "/api/connection-details";

export default function PageClientImpl(props: {
  roomName: string;
  region?: string;
  hq: boolean;
}) {
  const { userMetadata } = useUser();
  const [preJoinChoices, setPreJoinChoices] = React.useState<
    LocalUserChoices | undefined
  >(undefined);

  const preJoinDefaults = React.useMemo(() => {
    return {
      username: "",
      videoEnabled: true,
      audioEnabled: true,
    };
  }, []);
  const [connectionDetails, setConnectionDetails] = React.useState<
    ConnectionDetails | undefined
  >(undefined);

  const handlePreJoinSubmit = React.useCallback(
    async (values: LocalUserChoices) => {
      setPreJoinChoices(values);
      const url = new URL(CONN_DETAILS_ENDPOINT, window.location.origin);
      url.searchParams.append("roomName", props.roomName);
      url.searchParams.append("participantName", values.username);
      if (props.region) {
        url.searchParams.append("region", props.region);
      }
      const connectionDetailsResp = await fetch(url.toString());
      const connectionDetailsData = await connectionDetailsResp.json();
      setConnectionDetails(connectionDetailsData);
    },
    [],
  );
  const handlePreJoinError = React.useCallback(
    (e: any) => console.error(e),
    [],
  );

  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <>
      <main data-lk-theme="default" style={{ height: "100%" }}>
        {connectionDetails === undefined || preJoinChoices === undefined ? (
          <div
            style={{ display: "grid", placeItems: "center", height: "100%" }}
          >
            <PreJoin
              defaults={preJoinDefaults}
              onSubmit={handlePreJoinSubmit}
              onError={handlePreJoinError}
            />
          </div>
        ) : (
          <SpaceLayout
            userChoices={preJoinChoices}
            connectionDetails={connectionDetails}
            options={{ hq: true }}
          />
        )}
      </main>
    </>
  );
}
