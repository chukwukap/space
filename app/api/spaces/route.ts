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
  console.log("[GET] searchParams:", Array.from(searchParams.entries()));
  const namesParam = searchParams.get("names");
  console.log("[GET] namesParam:", namesParam);
  let names: string[] | undefined = undefined;

  if (namesParam) {
    names = namesParam
      .split(",")
      .map((n) => n.trim())
      .filter((n) => n.length > 0);
    if (names.length === 0) names = undefined;
    console.log("[GET] parsed names:", names);
  }

  // Query active spaces from the database, including the host participant and their user info
  let spaces;
  if (names && names.length > 0) {
    console.log("[GET] Querying spaces with names:", names);
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
    console.log("[GET] Querying all LIVE spaces");
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

  console.log("[GET] spaces result:", JSON.stringify(spaces, null, 2));
  return Response.json(spaces);
}

/**
 * Handles POST requests to create a new space.
 * - Ensures the LiveKit room is created.
 * - Always returns the created LiveKit room info.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("[POST] request body:", JSON.stringify(body, null, 2));
    const {
      title,
      hostFid,
      hostId,
      hostAddress,
      recording = false,
    } = body as {
      title?: string;
      hostFid?: string;
      hostId?: string;
      hostAddress?: string;
      recording?: boolean;
    };
    console.log("[POST] title:", title);
    console.log("[POST] hostFid:", hostFid);
    console.log("[POST] hostId:", hostId);
    console.log("[POST] hostAddress:", hostAddress);
    console.log("[POST] recording:", recording);

    if (!title || !hostFid || !hostAddress || !hostId) {
      console.log("[POST] Missing required fields");
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
    console.log("[POST] metadata:", JSON.stringify(metadata, null, 2));

    const hostUser = await prisma.user.findUnique({
      where: {
        id: parseInt(hostId),
        fid: parseInt(hostFid),
      },
    });
    console.log("[POST] hostUser:", JSON.stringify(hostUser, null, 2));

    if (!hostUser) {
      console.log("[POST] Host user not found");
      return new Response(JSON.stringify({ error: "Host user not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    const livekitRoomId = crypto.randomUUID().slice(0, 6);
    console.log("[POST] livekitRoomId:", livekitRoomId);

    // Ensure LiveKit room exists first for reliability and security
    const livekitRoom = await roomService.createRoom({
      name: livekitRoomId,
      metadata: JSON.stringify(metadata),
    });
    console.log("[POST] livekitRoom:", JSON.stringify(livekitRoom, null, 2));

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
    console.log("[POST] created space:", JSON.stringify(space, null, 2));

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
    console.error("[POST /api/spaces] error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function PATCH(request: Request) {
  const { searchParams } = new URL(request.url);
  console.log("[PATCH] searchParams:", Array.from(searchParams.entries()));
  const livekitName = searchParams.get("livekitName");
  console.log("[PATCH] livekitName:", livekitName);
  if (!livekitName) {
    console.log("[PATCH] livekitName missing");
    return new Response(JSON.stringify({ error: "livekitName required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // get room
    const room = await getRoom(livekitName);
    console.log("[PATCH] room:", JSON.stringify(room, null, 2));
    if (!room) {
      console.log("[PATCH] Room not found");
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
    console.log("[PATCH] meta before update:", JSON.stringify(meta, null, 2));

    meta.ended = true;
    await roomService.updateRoomMetadata(livekitName, JSON.stringify(meta));
    console.log("[PATCH] meta after update:", JSON.stringify(meta, null, 2));

    const updatedSpace = await prisma.space.update({
      where: { livekitName },
      data: { status: "ENDED" },
    });
    console.log(
      "[PATCH] updated space:",
      JSON.stringify(updatedSpace, null, 2),
    );

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[PATCH /api/spaces] error:", err);

    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
