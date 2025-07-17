import { RoomServiceClient, Room } from "livekit-server-sdk";

/**
 * LiveKit server-side helper utilities for UmbraSwap.
 *
 * SECURITY: Never expose the API secret to the client – all token
 * generation must happen on the server.
 */
const {
  LIVEKIT_API_KEY = "",
  LIVEKIT_API_SECRET = "",
  LIVEKIT_URL,
} = process.env as Record<string, string>;

if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
  console.warn(
    "[LiveKit] LIVEKIT_API_KEY or LIVEKIT_API_SECRET env vars are missing. Token generation & room management will fail until set.",
  );
}

/**
 * Singleton RoomServiceClient instance for interacting with the LiveKit
 * Cloud REST API (create, list, end rooms, etc.)
 */
export const roomService = new RoomServiceClient(
  LIVEKIT_URL,
  LIVEKIT_API_KEY,
  LIVEKIT_API_SECRET,
);

/**
 * Ensures that a room exists. If it does not, it will be created with the
 * provided name. LiveKit Cloud will auto-create rooms on first join, but we
 * create them proactively so we can apply custom settings in the future.
 */
export async function ensureRoom(roomId: string) {
  try {
    await roomService.createRoom({
      name: roomId,
      metadata: JSON.stringify({ title: "test", creator: "test" }),
    });
  } catch {
    // If room already exists, LiveKit returns 409; safe to ignore
  }
}

/**
 * Fetches a single space (room) by its roomId.
 * Returns the Room object if found, or null if not found.
 * SECURITY: Only exposes non-sensitive room data.
 */
export async function getRoom(roomId: string): Promise<Room | null> {
  try {
    const rooms = await roomService.listRooms([roomId]);
    // listRooms returns an array; find the room with the exact name
    const room = rooms.find((r) => r.name === roomId);
    return room || null;
  } catch (error) {
    // Log error for observability, but do not expose details to the user
    console.error(`[LiveKit] Failed to fetch room "${roomId}":`, error);
    return null;
  }
}
