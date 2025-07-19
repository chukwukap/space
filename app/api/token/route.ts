import { NextRequest, NextResponse } from "next/server";
import { AccessToken, TrackSource } from "livekit-server-sdk";

// Do not cache endpoint result
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const roomName = req.nextUrl.searchParams.get("roomName");
  const identity = req.nextUrl.searchParams.get("identity");
  const name = req.nextUrl.searchParams.get("name");
  const metadata = JSON.parse(req.nextUrl.searchParams.get("metadata") ?? "{}");

  if (!roomName) {
    return NextResponse.json(
      { error: 'Missing "roomName" query parameter' },
      { status: 400 },
    );
  } else if (!identity) {
    return NextResponse.json(
      { error: 'Missing "identity" query parameter' },
      { status: 400 },
    );
  } else if (!name) {
    return NextResponse.json(
      { error: 'Missing "name" query parameter' },
      { status: 400 },
    );
  } else if (metadata === undefined) {
    return NextResponse.json(
      { error: 'Missing "metadata" query parameter' },
      { status: 400 },
    );
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const wsUrl = process.env.LIVEKIT_URL;

  if (!apiKey || !apiSecret || !wsUrl) {
    return NextResponse.json(
      { error: "Server misconfigured" },
      { status: 500 },
    );
  }

  const at = new AccessToken(apiKey, apiSecret, { identity, name, metadata });
  console.log("metadata", metadata);

  at.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: metadata.isHost,
    canSubscribe: true, //
    canPublishSources: [TrackSource.MICROPHONE], // only allow microphone
    roomRecord: false,
  });

  return NextResponse.json(
    { token: await at.toJwt() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
