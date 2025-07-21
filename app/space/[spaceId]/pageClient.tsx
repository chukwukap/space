"use client";

import {
  LocalUserChoices,
  PreJoin,
  usePersistentUserChoices,
} from "@livekit/components-react";
import React from "react";
import "@livekit/components-styles";

import {
  ConnectionDetails,
  ParticipantMetadata,
  SpaceMetadata,
} from "@/lib/types";
import { useUser } from "@/app/providers/userProvider";

import TipSpaceRoom from "./_components/TipSpaceRoom";

const CONN_DETAILS_ENDPOINT =
  process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT ?? "/api/connection-details";

export default function PageClientImpl(props: {
  roomName: string;
  region?: string;
  hq: boolean;
  isHost: boolean;
  title: string;
}) {
  const { userMetadata } = useUser();
  const [preJoinChoices, setPreJoinChoices] = React.useState<
    LocalUserChoices | undefined
  >(undefined);

  // Compose the SpaceMetadata for the current space, ensuring host status is set correctly.
  const newParticipantMetadata = React.useMemo(() => {
    if (!userMetadata) return undefined;

    // Ensure the isHost property reflects the actual host status from props
    const part: ParticipantMetadata = {
      ...userMetadata,
      isHost: props.isHost,
    };

    return part;
  }, [userMetadata, props.isHost]);

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
      url.searchParams.append(
        "metadata",
        JSON.stringify(newParticipantMetadata),
      ); // required
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
