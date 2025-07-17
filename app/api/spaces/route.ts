import { getRoom, roomService } from "@/lib/livekit";
import { prisma } from "@/lib/prisma";
import { SpaceMetadata } from "@/lib/types";

export const revalidate = 0;

/**
 * Handles GET requests to fetch all active spaces.
 * Returns a list of spaces from the LiveKit service.
 */
export async function GET() {
  const spaces = await roomService.listRooms();
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
      hostFid,
      hostAddress,
      recording = false,
    } = (await request.json()) as {
      title?: string;
      hostFid?: string;
      hostAddress?: string;
      recording?: boolean;
    };

    if (!title || !hostFid || !hostAddress) {
      return new Response(
        JSON.stringify({ error: "title, hostFid, and hostAddress required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const metadata: SpaceMetadata = {
      title,
      hostFid,
      hostAddress,
      recording,
      ended: false,
    };

    const livekitRoomId = crypto.randomUUID().slice(0, 6);

    // Ensure LiveKit room exists first for reliability and security
    const livekitRoom = await roomService.createRoom({
      name: livekitRoomId,
      metadata: JSON.stringify(metadata),
    });

    // Try to persist in DB, but do not fail if this step fails
    try {
      await prisma.space.create({
        data: {
          title: metadata.title,
          livekitName: livekitRoom.name,
          hostFid: parseInt(metadata.hostFid),
          hostAddress: metadata.hostAddress,
          recording: metadata.recording,
          status: "LIVE",
        },
      });
    } catch (dbError) {
      // Log DB error for observability, but do not fail the route
      console.error("[POST /api/spaces] DB persist failed:", dbError);
    }

    // Fire-and-forget notifications (no await to keep response fast)
    // sendLiveSpaceNotifications(
    //   parseInt(hostFid),
    //   `${process.env.NEXT_PUBLIC_URL}/space/${livekitRoom.name}?title=${encodeURIComponent(title)}`,
    //   title,
    // ).catch(console.error);
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

export async function PATCH(request: Request) {
  const { searchParams } = new URL(request.url);
  const livekitName = searchParams.get("livekitName");
  if (!livekitName) {
    return new Response(JSON.stringify({ error: "livekitName required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // get room
    const room = await getRoom(livekitName);
    if (!room) {
      return new Response(JSON.stringify({ error: "Room not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Update metadata to mark ended
    const meta: SpaceMetadata = room.metadata
      ? JSON.parse(room.metadata)
      : {
          title: "",
          hostFid: 0,
          hostAddress: "",
          recording: false,
          ended: false,
        };

    meta.ended = true;
    await roomService.updateRoomMetadata(livekitName, JSON.stringify(meta));

    // Optionally set status in DB
    try {
      await prisma.space.update({
        where: { livekitName },
        data: { status: "ENDED" },
      });
    } catch {}

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[PATCH /api/spaces]", err);

    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
