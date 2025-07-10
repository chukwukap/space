"use client";

import {
  LiveKitRoom,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  ControlBar,
  useTracks,
  useRoomContext,
} from "@livekit/components-react";
import { Track, Participant } from "livekit-client";
import "@livekit/components-styles";
import { useEffect, useState } from "react";

interface AudioRoomProps {
  token: string;
  serverUrl: string;
}

// Add ParticipantList component
function ParticipantList() {
  const room = useRoomContext();
  const [, forceRender] = useState({});
  const [activeSpeakerIds, setActiveSpeakerIds] = useState<Set<string>>(
    new Set(),
  );

  // Force re-render on participant changes
  useEffect(() => {
    function handleChange() {
      forceRender({});
    }
    room.on("participantConnected", handleChange);
    room.on("participantDisconnected", handleChange);

    const speakerCb = () => {
      setActiveSpeakerIds(new Set(room.activeSpeakers.map((p) => p.identity)));
    };
    room.on("activeSpeakersChanged", speakerCb);

    return () => {
      room.off("participantConnected", handleChange);
      room.off("participantDisconnected", handleChange);
      room.off("activeSpeakersChanged", speakerCb);
    };
  }, [room]);

  const participants: Participant[] = [
    room.localParticipant,
    ...Array.from(room.remoteParticipants.values()),
  ];

  return (
    <ul className="fixed top-4 right-4 bg-[var(--lk-background)]/80 backdrop-blur-md p-3 rounded-lg shadow space-y-2 w-56 max-h-[70vh] overflow-y-auto text-sm">
      {participants.map((p) => (
        <li
          key={p.identity}
          className={`flex items-center gap-2 ${activeSpeakerIds.has(p.identity) ? "text-[var(--lk-accent)]" : ""}`}
        >
          <span
            className={`h-2 w-2 rounded-full ${activeSpeakerIds.has(p.identity) ? "bg-[var(--lk-accent)]" : "bg-gray-400"}`}
          />
          <span className="truncate">{p.identity}</span>
        </li>
      ))}
    </ul>
  );
}

function ConferenceView() {
  // Subscribe to track list for placeholder grid (mainly avatars)
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );

  return (
    <>
      <ParticipantList />
      <GridLayout
        tracks={tracks}
        style={{ height: "calc(100vh - var(--lk-control-bar-height))" }}
      >
        <ParticipantTile />
      </GridLayout>
      <RoomAudioRenderer />
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
