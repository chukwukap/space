import { NextRequest, NextResponse } from "next/server";
import { AccessToken, TrackSource } from "livekit-server-sdk";
import { ParticipantMetadata } from "@/lib/types";

// Do not cache endpoint result
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const roomName = req.nextUrl.searchParams.get("roomName");
  const identity = req.nextUrl.searchParams.get("identity");
  const name = req.nextUrl.searchParams.get("name");
  const meta = req.nextUrl.searchParams.get("metadata");

  if (!roomName || !identity || !name || !meta) {
    return NextResponse.json(
      {
        error:
          "Missing required query parameters: roomName, identity, name, metadata",
      },
      { status: 400 },
    );
  }

  const defaultMetadata: ParticipantMetadata = {
    pfpUrl: null,
    fid: null,
    userDbId: null,
    walletAddress: null,
    handRaised: false,
  };

  const participantMetadata: ParticipantMetadata = JSON.parse(meta);

  if (
    !participantMetadata ||
    !participantMetadata.fid ||
    !participantMetadata.userDbId ||
    !participantMetadata.walletAddress
  ) {
    return NextResponse.json({ error: "Invalid metadata" }, { status: 400 });
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

  const at = new AccessToken(apiKey, apiSecret, {
    identity,
    name,
    metadata: JSON.stringify({ ...defaultMetadata, ...participantMetadata }),
  });
  console.log("participantMetadata", participantMetadata);

  at.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishSources: [TrackSource.MICROPHONE],
    roomRecord: false,
  });

  return NextResponse.json(
    { token: await at.toJwt() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
