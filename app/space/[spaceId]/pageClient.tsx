"use client";

import {
  LocalUserChoices,
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
  const [userChoices, setUserChoices] = React.useState<LocalUserChoices>();

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

  // Fetch connection details once userChoices ready
  React.useEffect(() => {
    const fetchConn = async () => {
      const choices = initialUserChoices || preJoinDefaults;
      setUserChoices(choices);
      const url = new URL(CONN_DETAILS_ENDPOINT, window.location.origin);
      url.searchParams.append("roomName", props.roomName);
      url.searchParams.append("participantName", choices.username);
      url.searchParams.append("metadata", JSON.stringify(userMetadata)); // required
      if (props.region) {
        url.searchParams.append("region", props.region);
      }
      try {
        const resp = await fetch(url.toString());
        const data = await resp.json();
        setConnectionDetails(data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchConn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <main data-lk-theme="default" style={{ height: "100%" }}>
        {connectionDetails === undefined || userChoices === undefined ? (
          <div
            style={{ display: "grid", placeItems: "center", height: "100%" }}
          >
            Joining…
          </div>
        ) : (
          <TipSpaceRoom
            userChoices={userChoices}
            connectionDetails={connectionDetails}
            options={{ hq: props.hq }}
          />
        )}
      </main>
    </>
  );
}
