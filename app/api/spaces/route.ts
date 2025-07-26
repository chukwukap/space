import { NextRequest, NextResponse } from "next/server";
import { roomService } from "@/lib/livekit";
import type { Room } from "livekit-server-sdk";

/**
 * GET /api/spaces
 * Query param: ?rooms=room1,room2,room3
 * Returns a list of Room objects for the given room names (if any), or all rooms if not specified.
 * SECURITY: Only exposes non-sensitive room data.
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
    const rooms: Room[] = await roomService.listRooms(roomNames);

    // Only return non-sensitive data (Room object is already safe)
    return NextResponse.json(rooms, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    // Log error for observability, but do not expose details to the user
    console.error("[GET /api/spaces] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch spaces" },
      { status: 500 },
    );
  }
}
