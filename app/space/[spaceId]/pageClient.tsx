"use client";

import { LocalUserChoices } from "@livekit/components-react";
import React from "react";

import { ConnectionDetails, ParticipantMetadata } from "@/lib/types";
import { useUser } from "@/app/providers/userProvider";

import TipSpaceRoom from "./_components/TipSpaceRoom";
import { Button } from "@/components/ui/button";

const CONN_DETAILS_ENDPOINT =
  process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT ?? "/api/connection-details";

export default function PageClientImpl(props: {
  roomName: string;
  region?: string;
  title?: string;
  host?: boolean;
  hq: boolean;
}) {
  const { userMetadata } = useUser();

  const preJoinChoices = React.useMemo(() => {
    return {
      username: userMetadata?.username || userMetadata?.displayName || "Guest",
      videoEnabled: false,
      audioEnabled: true,
    } as LocalUserChoices;
  }, [userMetadata]);

  const [connectionDetails, setConnectionDetails] = React.useState<
    ConnectionDetails | undefined
  >(undefined);

  const isHost = React.useMemo(() => {
    if (typeof window === "undefined") return false;
    if (userMetadata?.isHost !== null && userMetadata?.isHost !== undefined)
      return userMetadata.isHost;
    return new URLSearchParams(window.location.search).get("host") === "true";
  }, [userMetadata]);

  const handlePreJoinSubmit = React.useCallback(async () => {
    const url = new URL(CONN_DETAILS_ENDPOINT, window.location.origin);
    url.searchParams.append("roomName", props.roomName);
    url.searchParams.append(
      "participantName",
      userMetadata?.username || "Guest",
    );

    // Always create a copy of userMetadata for safe mutation
    let metadataToSend: ParticipantMetadata | undefined = undefined;
    if (userMetadata) {
      metadataToSend = { ...userMetadata };
      // If host, title, and record are defined, we are creating a new space
      if (isHost && props.title) {
        metadataToSend.spaceTitle = decodeURIComponent(props.title);
      }
    }

    url.searchParams.append("metadata", JSON.stringify(metadataToSend ?? {})); // required

    if (props.region) {
      url.searchParams.append("region", props.region);
    }
    const connectionDetailsResp = await fetch(url.toString());
    const connectionDetailsData = await connectionDetailsResp.json();
    setConnectionDetails(connectionDetailsData);
  }, [props.roomName, props.region, userMetadata, isHost, props.title]);

  return (
    <>
      <main data-lk-theme="default" style={{ height: "100%" }}>
        {connectionDetails === undefined || preJoinChoices === undefined ? (
          <div className="flex flex-col items-center justify-center h-full">
            <h1 className="text-2xl font-bold">Join Space</h1>
            <p className="text-sm text-muted-foreground">
              {/* Please wait while we prepare the space for you. */}
              {props.roomName}
            </p>
            <Button onClick={handlePreJoinSubmit}>Join Space</Button>
          </div>
        ) : (
          <TipSpaceRoom
            userChoices={preJoinChoices}
            connectionDetails={connectionDetails}
            title={props.title}
            options={{ hq: props.hq }}
          />
        )}
      </main>
    </>
  );
}
