import { useState, useCallback } from "react";
import { Room } from "livekit-client";
import { useRouter } from "next/navigation";
import { SpaceWithHostParticipant, User } from "@/lib/types";

export function useLeaveRoom({
  room,
  user,
  space,
  router,
  toast,
}: {
  room: Room;
  user: User;
  space: SpaceWithHostParticipant;
  router: ReturnType<typeof useRouter>;
  toast?: { success: (msg: string) => void; error: (msg: string) => void };
}) {
  const [leaveLoading, setLeaveLoading] = useState(false);

  const onLeaveRoom = useCallback(async () => {
    if (leaveLoading) return;
    setLeaveLoading(true);
    try {
      // If host, end the space
      if (space.host.id === parseInt(user.id)) {
        try {
          await fetch(`/api/spaces?spaceId=${room.name}`, {
            method: "PATCH",
            body: JSON.stringify({ status: "ENDED" }),
          });
        } catch {
          toast?.error("Failed to end space on server");
        }
      }
      await room.disconnect();
      toast?.success("Left the room");
      router.push("/");
    } catch (err) {
      toast?.error("Failed to leave room");
      console.error("[LeaveRoom] Failed to leave room", err);
    } finally {
      setLeaveLoading(false);
    }
  }, [leaveLoading, room, user, space, router, toast]);

  return { onLeaveRoom, leaveLoading };
}
