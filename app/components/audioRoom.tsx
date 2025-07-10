"use client";

import {
  LiveKitRoom,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  ControlBar,
  useTracks,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import "@livekit/components-styles";

interface AudioRoomProps {
  token: string;
  serverUrl: string;
}

function ConferenceView() {
  // Subscribe to all camera (placeholder) and screen share tracks.
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );

  return (
    <>
      <GridLayout
        tracks={tracks}
        style={{ height: "calc(100vh - var(--lk-control-bar-height))" }}
      >
        <ParticipantTile />
      </GridLayout>
      {/* Playback incoming audio */}
      <RoomAudioRenderer />
      {/* Control bar – hide video & screen share toggles via props */}
      <ControlBar
        variation="minimal"
        style={{ borderTop: "1px solid var(--lk-border-color)" }}
      />
    </>
  );
}

/**
 * AudioRoom renders the LiveKit UI and connects the user to the provided room.
 * SECURITY: The token is generated server-side and passed as a prop. Do not
 * expose your LiveKit API key/secret on the client.
 */
export default function AudioRoom({ token, serverUrl }: AudioRoomProps) {
  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      data-lk-theme="default"
      connectOptions={{
        autoSubscribe: true,
      }}
      style={{ height: "100vh", width: "100%" }}
    >
      <ConferenceView />
    </LiveKitRoom>
  );
}
