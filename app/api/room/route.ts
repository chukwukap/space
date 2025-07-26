import { NextRequest, NextResponse } from "next/server";
import { roomService } from "@/lib/livekit";
import { prisma } from "@/lib/prisma";
import type { RoomWithMetadata } from "@/lib/types";
import type { Room } from "livekit-server-sdk";

/**
 * Safely serializes an object to JSON, converting BigInt values to strings.
 * This prevents JSON.stringify from throwing on BigInt values.
 * @param obj - The object to serialize
 * @returns A JSON-safe object
 */
function safeJson(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "bigint") return obj.toString();
  if (Array.isArray(obj)) return obj.map(safeJson);
  if (typeof obj === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = safeJson(v);
    }
    return out;
  }
  return obj;
}

/**
 * GET /api/room
 * Query param: ?rooms=room1,room2,room3
 * Returns a list of RoomWithMetadata objects for the given room names (if any), or all rooms if not specified.
 * SECURITY: Only exposes non-sensitive room data and metadata.
 */
export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const roomsParam = params.get("rooms");
    let roomNames: string[] | undefined = undefined;

    if (roomsParam) {
      // Parse comma-separated room names, trim whitespace, filter out empty
      roomNames = roomsParam
        .split(",")
        .map((name) => name.trim())
        .filter((name) => name.length > 0);
      if (roomNames.length === 0) {
        return NextResponse.json([], {
          status: 200,
          headers: { "Cache-Control": "no-store" },
        });
      }
    }

    // Fetch rooms from LiveKit via our wrapper
    const livekitRooms: Room[] = await roomService.listRooms(roomNames);

    if (!livekitRooms || livekitRooms.length === 0) {
      return NextResponse.json([], {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      });
    }

    // Get the livekitName(s) from the rooms to query metadata from DB
    const livekitNames = livekitRooms.map((room: Room) => room.name);

    // Fetch metadata for each room from the database, including host info
    // Only fetch rooms that are currently LIVE for security and consistency
    const dbSpaces = await prisma.space.findMany({
      where: {
        livekitName: { in: livekitNames },
        status: "LIVE",
      },
      include: {
        host: {
          select: {
            avatarUrl: true,
            displayName: true,
            username: true,
            id: true,
          },
        },
        participants: {
          take: 5,
          where: {
            role: {
              in: ["HOST", "SPEAKER"],
            },
          },
          select: {
            user: {
              select: {
                avatarUrl: true,
                displayName: true,
                username: true,
                id: true,
              },
            },
          },
        },
      },
    });

    // Map livekit rooms to RoomWithMetadata, merging DB metadata
    // RoomWithMetadata extends Room, so we must spread the Room fields and add metadata
    const roomsWithMetadata: RoomWithMetadata[] = livekitRooms
      .map((room: Room) => {
        const dbSpace = dbSpaces.find((s) => s.livekitName === room.name);

        // Defensive: If no DB metadata, skip this room (should not happen)
        if (!dbSpace) return null;

        // Compose metadata, only exposing non-sensitive fields
        return {
          ...room,
          metadata: dbSpace,
        } as RoomWithMetadata;
      })
      .filter((r): r is RoomWithMetadata => r !== null);

    // Only return non-sensitive data (RoomWithMetadata object is already safe)
    // SECURITY: Ensure no BigInt values are present in the response
    const safeRoomsWithMetadata = safeJson(roomsWithMetadata);

    return new NextResponse(JSON.stringify(safeRoomsWithMetadata), {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Log error for observability, but do not expose details to the user
    console.error("[GET /api/room] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch rooms" },
      { status: 500 },
    );
  }
}
