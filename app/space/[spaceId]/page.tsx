import { Room } from "livekit-server-sdk";
import SpaceRoom from "./_components/spaceRoom";
import { livekitWsUrl, roomService } from "@/lib/livekit";

export const revalidate = 0;

export default async function SpacePage({
  params,
  searchParams,
}: {
  params: Promise<{ spaceId: string }>;
  searchParams: Promise<{ title?: string }>;
}) {
  const { spaceId } = await params;

  const { title } = await searchParams;

  // Attempt to fetch the room details securely from the backend
  const room = await getRoom(spaceId);

  // Decode the title from the query string, if present
  const decodedTitle = title ? decodeURIComponent(title) : "Untitled Space";

  // If the room does not exist, show a gentle error message
  if (!room) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-6">
        <h2 className="text-2xl font-bold mb-2">Space Not Found</h2>
        <p className="text-gray-400 mb-6">
          Sorry, this Space doesn&apos;t exist or has ended.
          <br />
          Please check the link or return to the homepage to discover live
          Spaces.
        </p>
        <a
          href="/"
          className="inline-block px-6 py-2 rounded-lg bg-violet-600 text-white font-semibold hover:bg-violet-700 transition"
        >
          Back to Home
        </a>
      </div>
    );
  }

  // Render the live SpaceRoom if the room exists
  return (
    <SpaceRoom
      serverUrl={livekitWsUrl}
      spaceId={spaceId}
      title={decodedTitle}
    />
  );
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
