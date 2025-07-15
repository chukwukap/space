import { roomService as spaceService } from "@/lib/livekit";
import { prisma } from "@/lib/prisma";
import { SpaceMetadata } from "@/lib/types";
import { sendLiveSpaceNotifications } from "@/lib/notifyLive";

export const revalidate = 0;

/**
 * Handles GET requests to fetch all active spaces.
 * Returns a list of spaces from the LiveKit service.
 */
export async function GET() {
  const spaces = await spaceService.listRooms();
  const data = await Promise.all(
    spaces.map(async (space) => {
      // Optionally, you could fetch participant avatars here for richer UI.
      return space;
    }),
  );

  return Response.json(data);
}

/**
 * Handles POST requests to create a new space.
 * - Ensures the LiveKit room is created.
 * - Optionally persists the space in the database, but does not fail the route if DB write fails.
 * - Always returns the created LiveKit room info.
 */
export async function POST(request: Request) {
  try {
    const {
      title,
      hostId,
      recording = false,
    } = (await request.json()) as {
      title?: string;
      hostId?: string;
      recording?: boolean;
    };

    if (!title || !hostId) {
      return new Response(
        JSON.stringify({ error: "title and hostId required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const metadata: SpaceMetadata = {
      title,
      hostId,
      recording,
    };

    // Ensure LiveKit room exists first for reliability and security
    const livekitRoom = await spaceService.createRoom({
      name: crypto.randomUUID(),
      metadata: JSON.stringify(metadata),
    });

    // Try to persist in DB, but do not fail if this step fails
    try {
      await prisma.space.create({
        data: {
          id: livekitRoom.name,
          title: metadata.title,
          hostId: parseInt(metadata.hostId),
          recording: metadata.recording,
          status: "LIVE",
        },
      });
    } catch (dbError) {
      // Log DB error for observability, but do not fail the route
      console.error("[POST /api/spaces] DB persist failed:", dbError);
    }

    // Fire-and-forget notifications (no await to keep response fast)
    sendLiveSpaceNotifications(
      parseInt(hostId),
      `${process.env.NEXT_PUBLIC_URL}/space/${livekitRoom.name}?title=${encodeURIComponent(title)}`,
      title,
    ).catch(console.error);
    // DB hostId already int; no change needed

    // Always respond with LiveKit room info
    return new Response(JSON.stringify(livekitRoom), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log unexpected errors and return a generic error message
    console.error("[POST /api/spaces]", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
