import { getRoom, roomService } from "@/lib/livekit";
import { prisma } from "@/lib/prisma";
import { SpaceMetadata } from "@/lib/types";

export const revalidate = 0;

/**
 * Handles GET requests to fetch all active Sonic Space rooms.
 * If ?names=room1,room2 is provided, returns only those active spaces (LIVE status) with matching livekitName.
 * Otherwise, returns all active spaces (LIVE status).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const namesParam = searchParams.get("names");
  let names: string[] | undefined = undefined;

  if (namesParam) {
    names = namesParam
      .split(",")
      .map((n) => n.trim())
      .filter((n) => n.length > 0);
    if (names.length === 0) names = undefined;
  }

  // Query active spaces from the database
  let spaces;
  if (names && names.length > 0) {
    // Fetch only spaces with livekitName in names and status LIVE
    spaces = await prisma.space.findMany({
      where: {
        livekitName: { in: names },
        status: "LIVE",
      },
      orderBy: { createdAt: "desc" },
    });
  } else {
    // Fetch all active spaces (LIVE)
    spaces = await prisma.space.findMany({
      where: { status: "LIVE" },
      orderBy: { createdAt: "desc" },
    });
  }

  // Security: Only return safe, necessary fields for the client
  const safeSpaces = spaces.map((space) => ({
    id: space.id,
    livekitName: space.livekitName,
    title: space.title,
    hostFid: space.hostFid,
    hostAddress: space.hostAddress,
    recording: space.recording,
    createdAt: space.createdAt,
    // Add more fields as needed, but avoid leaking sensitive info
  }));

  return Response.json(safeSpaces);
}

/**
 * Handles POST requests to create a new space.
 * - Ensures the LiveKit room is created.
 * - Always returns the created LiveKit room info.
 */
export async function POST(request: Request) {
  try {
    const {
      title,
      hostFid,
      hostId,
      hostAddress,
      recording = false,
    } = (await request.json()) as {
      title?: string;
      hostFid?: string;
      hostId?: string;
      hostAddress?: string;
      recording?: boolean;
    };
    console.log("title", title);
    console.log("hostFid", hostFid);
    console.log("hostId", hostId);
    console.log("hostAddress", hostAddress);
    console.log("recording", recording);

    if (!title || !hostFid || !hostAddress || !hostId) {
      return new Response(
        JSON.stringify({
          error: "title, hostFid, hostId, and hostAddress required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const metadata: SpaceMetadata = {
      title,
      hostFid,
      hostId,
      hostAddress,
      recording,
      ended: false,
    };

    const hostUser = await prisma.user.findUnique({
      where: {
        id: parseInt(hostId),
        fid: parseInt(hostFid),
      },
    });

    if (!hostUser) {
      return new Response(JSON.stringify({ error: "Host user not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    const livekitRoomId = crypto.randomUUID().slice(0, 6);

    // Ensure LiveKit room exists first for reliability and security
    const livekitRoom = await roomService.createRoom({
      name: livekitRoomId,
      metadata: JSON.stringify(metadata),
    });

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

    await prisma.space.update({
      where: { livekitName },
      data: { status: "ENDED" },
    });

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
