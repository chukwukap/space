import {
  Room,
  ParticipantEvent,
  RoomEvent,
  RemoteTrack,
  RemoteTrackPublication,
  VideoQuality,
  LocalVideoTrack,
  isVideoTrack,
} from "livekit-client";
import * as React from "react";

export type LowCPUOptimizerOptions = {
  reducePublisherVideoQuality: boolean;
  reduceSubscriberVideoQuality: boolean;
  disableVideoProcessing: boolean;
};

const defaultOptions: LowCPUOptimizerOptions = {
  reducePublisherVideoQuality: true,
  reduceSubscriberVideoQuality: true,
  disableVideoProcessing: false,
} as const;

/**
 * Hook that automatically lowers video quality or disables video processing when CPU
 * constraints are detected on the client device. This dramatically improves the
 * experience for users on lower-end hardware and mobile devices.
 */
export function useLowCPUOptimizer(
  room: Room,
  options: Partial<LowCPUOptimizerOptions> = {},
) {
  const [lowPowerMode, setLowPowerMode] = React.useState(false);
  const opts = React.useMemo(
    () => ({ ...defaultOptions, ...options }),
    [options],
  );

  React.useEffect(() => {
    const handleCpuConstrained = async (track: LocalVideoTrack) => {
      setLowPowerMode(true);
      console.warn("[LiveKit] Local track CPU constrained", track);
      if (opts.reducePublisherVideoQuality) {
        track.prioritizePerformance();
      }
      if (opts.disableVideoProcessing && isVideoTrack(track)) {
        track.stopProcessor();
      }
      if (opts.reduceSubscriberVideoQuality) {
        room.remoteParticipants.forEach((participant) => {
          participant.videoTrackPublications.forEach((publication) => {
            publication.setVideoQuality(VideoQuality.LOW);
          });
        });
      }
    };

    room.localParticipant.on(
      ParticipantEvent.LocalTrackCpuConstrained,
      handleCpuConstrained,
    );
    return () => {
      room.localParticipant.off(
        ParticipantEvent.LocalTrackCpuConstrained,
        handleCpuConstrained,
      );
    };
  }, [
    room,
    opts.reducePublisherVideoQuality,
    opts.reduceSubscriberVideoQuality,
    opts.disableVideoProcessing,
  ]);

  React.useEffect(() => {
    const lowerQuality = (
      _: RemoteTrack,
      publication: RemoteTrackPublication,
    ) => {
      publication.setVideoQuality(VideoQuality.LOW);
    };
    if (lowPowerMode && opts.reduceSubscriberVideoQuality) {
      room.on(RoomEvent.TrackSubscribed, lowerQuality);
    }

    return () => {
      room.off(RoomEvent.TrackSubscribed, lowerQuality);
    };
  }, [lowPowerMode, room, opts.reduceSubscriberVideoQuality]);

  return lowPowerMode;
}
