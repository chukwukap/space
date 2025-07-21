"use client";

import {
  LocalUserChoices,
  PreJoin,
  usePersistentUserChoices,
} from "@livekit/components-react";
import React from "react";
import "@livekit/components-styles";

import { ConnectionDetails } from "@/lib/types";
import { useUser } from "@/app/providers/userProvider";

import TipSpaceRoom from "./_components/TipSpaceRoom";

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
      username: userMetadata?.username || userMetadata?.displayName || "Guest",
      videoEnabled: false,
      audioEnabled: true,
    };
  }, []);

  const {
    userChoices: initialUserChoices,
    saveAudioInputDeviceId,
    saveAudioInputEnabled,
    saveVideoInputDeviceId,
    saveVideoInputEnabled,
    saveUsername,
  } = usePersistentUserChoices({
    defaults: preJoinDefaults,
    preventSave: true,
    preventLoad: true,
  });
  const [connectionDetails, setConnectionDetails] = React.useState<
    ConnectionDetails | undefined
  >(undefined);

  const handlePreJoinSubmit = React.useCallback(
    async (values: LocalUserChoices) => {
      setPreJoinChoices(values);
      const url = new URL(CONN_DETAILS_ENDPOINT, window.location.origin);
      url.searchParams.append("roomName", props.roomName);
      url.searchParams.append("participantName", values.username);
      url.searchParams.append("metadata", JSON.stringify(userMetadata)); // required
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
          <TipSpaceRoom
            userChoices={preJoinChoices}
            connectionDetails={connectionDetails}
            options={{ hq: props.hq }}
          />
        )}
      </main>
    </>
  );
}
