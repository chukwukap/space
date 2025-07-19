import { getRoom, roomService } from "@/lib/livekit";
import { prisma } from "@/lib/prisma";
import { SpaceMetadata } from "@/lib/types";

export const revalidate = 0;

/**
 * Handles GET requests to fetch all active Sonic Space rooms.
 * If ?names=room1,room2 is provided, returns only those active spaces (LIVE status) with matching livekitName.
 * Otherwise, returns all active spaces (LIVE status).
 *
 * Each space returned includes:
 *  - the host participant (role: HOST) and their user info
 *  - the total participants count
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

  // Query active spaces from the database, including the host participant and their user info
  let spaces;
  if (names && names.length > 0) {
    spaces = await prisma.space.findMany({
      where: {
        livekitName: { in: names },
        status: "LIVE",
      },
      orderBy: { createdAt: "desc" },
      include: {
        participants: {
          where: { role: "HOST" },
          include: { user: true },
        },
        host: true,
        _count: {
          select: { participants: true },
        },
      },
    });
  } else {
    spaces = await prisma.space.findMany({
      where: { status: "LIVE" },
      orderBy: { createdAt: "desc" },
      include: {
        participants: {
          where: { role: "HOST" },
          include: { user: true },
        },
        host: true,
        _count: {
          select: { participants: true },
        },
      },
    });
  }

  return Response.json(spaces);
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

    const space = await prisma.space.create({
      data: {
        title: metadata.title,
        livekitName: livekitRoom.name,
        hostId: hostUser.id,
        hostAddress: metadata.hostAddress,
        recording: metadata.recording,
        status: "LIVE",
      },
      include: {
        host: true,
      },
    });

    // Fire-and-forget notifications (no await to keep response fast)
    // sendLiveSpaceNotifications(
    //   parseInt(hostFid),
    //   `${process.env.NEXT_PUBLIC_URL}/spaces/${livekitRoom.name}?title=${encodeURIComponent(title)}`,
    //   title,
    // ).catch(console.error);
    // DB hostId already int; no change needed

    // Always respond with LiveKit room info
    return new Response(JSON.stringify(space), {
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
