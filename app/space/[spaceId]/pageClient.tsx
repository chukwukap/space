"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { LocalUserChoices } from "@livekit/components-react";
import { useUser } from "@/app/providers/userProvider";
import { ConnectionDetails, ParticipantMetadata } from "@/lib/types";
import TipSpaceRoom from "./_components/TipSpaceRoom";
import { Button } from "@/components/ui/button";

/**
 * This page is tightly coupled to the /api/connection-details route.
 * It handles all required query params, user metadata, and error states
 * to ensure a secure and smooth join/host experience.
 */

// Helper: Build a valid ParticipantMetadata object, filling required fields
function buildParticipantMetadata(
  userMetadata: ParticipantMetadata | null,
  isHost: boolean,
  title?: string,
): ParticipantMetadata {
  // Fallbacks for required fields
  return {
    fid: typeof userMetadata?.fid === "number" ? userMetadata.fid : 0, // TODO: fix this
    address: userMetadata?.address || "",
    displayName: userMetadata?.displayName || "Guest",
    username: userMetadata?.username || "Guest",
    pfpUrl: userMetadata?.pfpUrl || "",
    identity:
      typeof userMetadata?.identity === "number" ? userMetadata.identity : 0,
    clientFid: userMetadata?.clientFid ?? null,
    isHost: isHost ? true : false,
    handRaised: userMetadata?.handRaised,
    spaceTitle: isHost && title ? decodeURIComponent(title) : undefined,
    spaceName: userMetadata?.spaceName,
  };
}

export default function PageClientImpl(props: {
  roomName: string;
  region?: string;
  title?: string;
  host?: boolean;
  hq: boolean;
}) {
  const { userMetadata } = useUser();

  // State for connection details and loading/error
  const [connectionDetails, setConnectionDetails] =
    useState<ConnectionDetails>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determine if user is host (from props, userMetadata, or URL)
  const isHost = useMemo(() => {
    // check metadata first incase this is a returning user
    if (userMetadata?.isHost !== null && userMetadata?.isHost !== undefined)
      return userMetadata.isHost;
    // check url params for host
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search).get("host") === "true";
    }
    // check props for host
    if (props.host !== undefined) return props.host;
    return false;
  }, [props.host, userMetadata]);

  // Prepare pre-join choices for LiveKit
  const preJoinChoices = useMemo(() => {
    return {
      username: userMetadata?.username || userMetadata?.displayName || "Guest",
      videoEnabled: false,
      audioEnabled: true,
    } as LocalUserChoices;
  }, [userMetadata]);

  // Handles join/host action, fetches connection details securely
  const handlePreJoin = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL("/api/connection-details", window.location.origin);
      url.searchParams.append("roomName", props.roomName);
      url.searchParams.append(
        "participantName",
        userMetadata?.username || userMetadata?.displayName || "Guest",
      );
      url.searchParams.append(
        "metadata",
        JSON.stringify(
          buildParticipantMetadata(userMetadata, isHost, props.title),
        ),
      );
      if (props.region) url.searchParams.append("region", props.region);
      if (isHost) url.searchParams.append("host", "true");

      const resp = await fetch(url.toString());
      if (!resp.ok) {
        const text = await resp.text();
        setError(text || "Failed to join space.");
        setLoading(false);
        return;
      }
      const data: ConnectionDetails = await resp.json();
      setConnectionDetails(data);
    } catch (err) {
      console.error("[pageClient] Error in handlePreJoin:", err);
      setError("Could not connect to the space. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [props.roomName, props.region, userMetadata, isHost, props.title]);

  // Auto-join if user is host and all required info is present
  useEffect(() => {
    if (
      isHost &&
      props.title &&
      userMetadata &&
      !connectionDetails &&
      !loading &&
      !error
    ) {
      handlePreJoin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, props.title, userMetadata]);

  // UI: Show join/host, loading, error, or the room
  return (
    <main data-lk-theme="default" style={{ height: "100%" }}>
      {!connectionDetails ? (
        <div className="flex flex-col items-center justify-center h-full">
          <h1 className="text-2xl font-bold">
            {isHost ? "Host a Space" : "Join Space"}
          </h1>
          <p className="text-sm text-muted-foreground mb-2">
            {props.title ? decodeURIComponent(props.title) : props.roomName}
          </p>
          {error && (
            <div className="text-red-500 text-sm mb-2 max-w-xs text-center">
              {error}
            </div>
          )}
          <Button
            onClick={handlePreJoin}
            disabled={loading}
            className="w-32"
            aria-busy={loading}
          >
            {loading
              ? isHost
                ? "Creating..."
                : "Joining..."
              : isHost
                ? "Host Space"
                : "Join Space"}
          </Button>
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
  );
}
