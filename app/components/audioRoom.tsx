"use client";

import { LiveKitRoom } from "@livekit/components-react";
import "@livekit/components-styles";

interface AudioRoomProps {
  token: string;
  serverUrl: string;
}

/**
 * AudioRoom renders the LiveKit UI and connects the user to the provided room.
 *
 * SECURITY: The token is generated server-side and passed as a prop. Do not
 * expose your LiveKit API key/secret on the client.
 */
export default function AudioRoom({ token, serverUrl }: AudioRoomProps) {
  return (
    <LiveKitRoom
      data-lk-theme="default"
      token={token}
      serverUrl={serverUrl}
      style={{ height: "100vh", width: "100%" }}
    />
  );
}
