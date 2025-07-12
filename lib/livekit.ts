import { RoomServiceClient, AccessToken, Room } from "livekit-server-sdk";

/**
 * LiveKit server-side helper utilities for UmbraSwap.
 *
 * SECURITY: Never expose the API secret to the client – all token
 * generation must happen on the server.
 */
const {
  LIVEKIT_API_KEY = "",
  LIVEKIT_API_SECRET = "",
  LIVEKIT_URL = "https://spaces.vercel.app",
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

export const livekitWsUrl: string =
  process.env.NEXT_PUBLIC_LIVEKIT_WS_URL || LIVEKIT_URL.replace(/^http/, "ws");

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
 * Creates a new LiveKit room with the given title and creator.
 * Returns the created room object.
 */
export async function createRoom(title: string, creator: string) {
  const roomId = crypto.randomUUID();
  const room = await roomService.createRoom({
    name: roomId,
    metadata: JSON.stringify({ title, creator }),
  });
  return room;
}

/**
 * Generates a signed JWT that allows a user to join the specified LiveKit
 * room. The token grants the user permission to publish & subscribe (host
 * determines actual permissions client-side).
 */
export async function generateAccessToken({
  roomName,
  userId,
}: {
  roomName: string;
  userId: string;
}): Promise<string> {
  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    throw new Error(
      "LiveKit credentials are not configured. Set LIVEKIT_API_KEY and LIVEKIT_API_SECRET env vars.",
    );
  }

  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: userId,
  });

  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
  });

  return await at.toJwt();
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
