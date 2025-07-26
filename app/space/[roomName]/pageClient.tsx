"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { LocalUserChoices } from "@livekit/components-react";
import { useUser } from "@/app/providers/userProvider";
import { ConnectionDetails, FCContext, ParticipantMetadata } from "@/lib/types";
import TipSpaceRoom from "./_components/TipSpaceRoom";
import { Button } from "@/components/ui/button";

/**
 * This page is tightly coupled to the /api/connection-details route.
 * It handles all required query params, user metadata, and error states
 * to ensure a secure and smooth join/host experience.
 */

// Helper: Build a valid ParticipantMetadata object, filling required fields
function buildParticipantMetadata(
  farcasterContext: FCContext | null,
  isHost: boolean,
  title?: string,
): ParticipantMetadata | null {
  if (!farcasterContext) return null;
  return {
    fcContext: farcasterContext,
    isHost,
    title,
    // TODO: add identity on the backend
  };
}

export default function PageClientImpl(props: {
  roomName: string;
  region?: string;
  hq: boolean;
  // these two are only used for host
  title?: string;
  host?: boolean;
}) {
  const { farcasterContext } = useUser();

  // State for connection details and loading/error
  const [connectionDetails, setConnectionDetails] =
    useState<ConnectionDetails>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prepare pre-join choices for LiveKit
  const preJoinChoices = useMemo(() => {
    return {
      username:
        farcasterContext?.farcasterUser?.username ||
        farcasterContext?.farcasterUser?.displayName ||
        "Guest",
      videoEnabled: false,
      audioEnabled: true,
    } as LocalUserChoices;
  }, [farcasterContext]);

  // Handles join/host action, fetches connection details securely
  const handlePreJoin = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL("/api/connection-details", window.location.origin);
      url.searchParams.append("roomName", props.roomName);
      url.searchParams.append(
        "participantName",
        farcasterContext?.farcasterUser?.username ||
          farcasterContext?.farcasterUser?.displayName?.replace(/ /g, "_") ||
          "Guest",
      );
      url.searchParams.append(
        "metadata",
        JSON.stringify(
          buildParticipantMetadata(
            farcasterContext,
            props.host ?? false,
            props.title,
          ),
        ),
      );
      if (props.region) url.searchParams.append("region", props.region);
      if (props.host) url.searchParams.append("host", "true");

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
  }, [props.roomName, props.region, farcasterContext, props.host, props.title]);

  // Auto-join if user is host and all required info is present
  useEffect(() => {
    if (
      props.host &&
      props.title &&
      farcasterContext &&
      !connectionDetails &&
      !loading &&
      !error
    ) {
      handlePreJoin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.host, props.title, farcasterContext]);

  // UI: Show join/host, loading, error, or the room
  return (
    <main data-lk-theme="default" style={{ height: "100%" }}>
      {!connectionDetails ? (
        <div className="flex flex-col items-center justify-center h-full">
          <h1 className="text-2xl font-bold">
            {props.host ? "Host a Space" : "Join Space"}
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
              ? props.host
                ? "Creating..."
                : "Joining..."
              : props.host
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
