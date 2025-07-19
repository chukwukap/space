import { useState, useCallback } from "react";
import { Room } from "livekit-client";

export function useHandRaise({
  room,
  sendData,
  toast,
}: {
  room: Room;
  sendData: (msg: Record<string, unknown>) => void;
  toast?: { success: (msg: string) => void; error: (msg: string) => void };
}) {
  const [handRaiseLoading, setHandRaiseLoading] = useState(false);

  // Local participant raises hand
  const onRaiseHand = useCallback(async () => {
    if (handRaiseLoading) return;
    if (room.localParticipant) {
      setHandRaiseLoading(true);
      try {
        const meta = room.localParticipant.metadata
          ? JSON.parse(room.localParticipant.metadata)
          : {};
        if (!meta.handRaised) {
          meta.handRaised = true;
          await room.localParticipant.setMetadata(JSON.stringify(meta));
          sendData({ type: "handRaise", sid: room.localParticipant.sid });
          toast?.success("Hand raised!");
        }
      } catch (err) {
        toast?.error("Failed to raise hand");
        console.error("[HandRaise] Failed to raise hand", err);
      } finally {
        setHandRaiseLoading(false);
      }
    }
  }, [room, sendData, handRaiseLoading, toast]);

  // Local participant lowers hand (self or on host request)
  const clearHandRaise = useCallback(async () => {
    if (room.localParticipant) {
      try {
        const meta = room.localParticipant.metadata
          ? JSON.parse(room.localParticipant.metadata)
          : {};
        if (meta.handRaised) {
          delete meta.handRaised;
          await room.localParticipant.setMetadata(JSON.stringify(meta));
        }
      } catch (err) {
        console.error("[HandRaise] Failed to clear hand raise", err);
      }
    }
  }, [room]);

  return { onRaiseHand, clearHandRaise, handRaiseLoading };
}
