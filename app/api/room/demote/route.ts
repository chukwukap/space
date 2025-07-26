import { NextRequest, NextResponse } from "next/server";
import { roomService } from "@/lib/livekit";
import { TrackSource } from "livekit-server-sdk";

export async function POST(request: NextRequest) {
  try {
    const { roomName, identity } = await request.json();

    if (typeof roomName !== "string" || typeof identity !== "string") {
      return NextResponse.json(
        { error: "roomName and identity are required" },
        { status: 400 },
      );
    }

    // Update participant permissions to remove publishing microphone
    await roomService.updateParticipant(roomName, identity, {
      permission: {
        canPublish: false,
        canSubscribe: true,
        canPublishData: true,
        canPublishSources: [TrackSource.MICROPHONE],
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DemoteToListener]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
