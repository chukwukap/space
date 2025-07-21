"use client";

import { LocalUserChoices } from "@livekit/components-react";
import React from "react";
import "@livekit/components-styles";

import { ConnectionDetails } from "@/lib/types";
import { useUser } from "@/app/providers/userProvider";

import TipSpaceRoom from "./_components/TipSpaceRoom";
import { Button } from "@/components/ui/button";

const CONN_DETAILS_ENDPOINT =
  process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT ?? "/api/connection-details";

export default function PageClientImpl(props: {
  roomName: string;
  region?: string;
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

  const handlePreJoinSubmit = React.useCallback(async () => {
    const url = new URL(CONN_DETAILS_ENDPOINT, window.location.origin);
    url.searchParams.append("roomName", props.roomName);
    url.searchParams.append(
      "participantName",
      userMetadata?.username || "Guest",
    );
    url.searchParams.append("metadata", JSON.stringify(userMetadata)); // required
    if (props.region) {
      url.searchParams.append("region", props.region);
    }
    const connectionDetailsResp = await fetch(url.toString());
    const connectionDetailsData = await connectionDetailsResp.json();
    setConnectionDetails(connectionDetailsData);
  }, [props.roomName, props.region, userMetadata]);

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
            options={{ hq: props.hq }}
          />
        )}
      </main>
    </>
  );
}
