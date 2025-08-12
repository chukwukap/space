"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { LocalUserChoices } from "@livekit/components-react";
import { useUser } from "@/app/providers/userProvider";
import { ConnectionDetails, FCContext, ParticipantMetadata } from "@/lib/types";
import TipSpaceRoom from "./_components/TipSpaceRoom";
import { Button } from "@/components/ui/button";
import MobileHeader from "@/app/_components/mobileHeader";
import { motion, AnimatePresence } from "framer-motion";

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
    <main data-lk-theme="default" className="h-full">
      {!connectionDetails ? (
        <div className="h-full w-full">
          <MobileHeader showBack lowerVisible title={props.roomName} />
          <div className="pt-12 h-full">
            <div className="h-full flex flex-col">
              <div className="flex-1 flex items-center justify-center px-4 py-6">
                <motion.div
                  className="w-full max-w-sm rounded-2xl border border-border/60 bg-background/70 backdrop-blur p-5 shadow-sm"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ fontFamily: "Sora, var(--font-sora), sans-serif" }}
                >
                  <div className="flex flex-col gap-2 text-center">
                    <h1 className="text-lg font-bold">
                      {props.host ? "Host this Space" : "Join this Space"}
                    </h1>
                    <p className="text-xs text-muted-foreground truncate">
                      {props.title
                        ? decodeURIComponent(props.title)
                        : props.roomName}
                    </p>
                  </div>
                  <div className="mt-4 rounded-xl bg-muted/40 border border-border/60 p-3 text-xs text-muted-foreground">
                    <ul className="space-y-1">
                      <li>• Live audio uses your mic while in the room</li>
                      <li>• You can tip hosts and speakers in-app</li>
                      <li>• Leave anytime — rejoin with a tap</li>
                    </ul>
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        key="join-error"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="mt-3 text-destructive text-xs text-center"
                        role="alert"
                        aria-live="polite"
                      >
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="mt-5">
                    <Button
                      onClick={handlePreJoin}
                      disabled={loading}
                      aria-busy={loading}
                      className="w-full h-11 text-sm font-medium"
                    >
                      {loading ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="inline-block h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                          {props.host ? "Creating" : "Joining"}
                        </span>
                      ) : props.host ? (
                        "Host Space"
                      ) : (
                        "Start Listening"
                      )}
                    </Button>
                    <p className="mt-2 text-[11px] text-center text-muted-foreground">
                      You can change mic access in the room settings.
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
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
