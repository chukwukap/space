import { NextResponse } from "next/server";
import { generateAccessToken, ensureRoom, livekitWsUrl } from "@/lib/livekit";

/**
 * POST /api/livekit
 *
 * Request body: { "roomName": string, "userId": string }
 *
 * Response: { token: string, url: string }
 */
export async function POST(request: Request) {
  try {
    const { roomName, userId } = (await request.json()) as {
      roomName?: string;
      userId?: string;
    };

    if (!roomName || !userId) {
      return NextResponse.json(
        { error: "roomName and userId are required" },
        { status: 400 },
      );
    }

    // Ensure room exists before generating tokens
    await ensureRoom(roomName);

    const token = generateAccessToken({ roomName, userId });

    return NextResponse.json(
      {
        token,
        url: process.env.NEXT_PUBLIC_LIVEKIT_WS_URL ?? livekitWsUrl,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[LiveKit] token generation failed", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unknown error generating token",
      },
      { status: 500 },
    );
  }
}
