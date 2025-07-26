import { randomString } from "@/lib/client-utils";
import { getLiveKitURL } from "@/lib/getLiveKitURL";
import { ConnectionDetails, ParticipantMetadata } from "@/lib/types";
import {
  AccessToken,
  AccessTokenOptions,
  TrackSource,
  VideoGrant,
} from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";
// Use generated Prisma client
import { Role } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;

const COOKIE_KEY = "random-participant-postfix";

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const roomName = request.nextUrl.searchParams.get("roomName");
    const participantName = request.nextUrl.searchParams.get("participantName");
    const metadata = request.nextUrl.searchParams.get("metadata") ?? "";
    const region = request.nextUrl.searchParams.get("region");
    const isHost = request.nextUrl.searchParams.get("host") === "true";

    if (!LIVEKIT_URL) {
      throw new Error("LIVEKIT_URL is not defined");
    }
    const livekitServerUrl = region
      ? getLiveKitURL(LIVEKIT_URL, region)
      : LIVEKIT_URL;
    let randomParticipantPostfix = request.cookies.get(COOKIE_KEY)?.value;
    if (livekitServerUrl === undefined) {
      throw new Error("Invalid region");
    }

    if (typeof roomName !== "string") {
      return new NextResponse("Missing required query parameter: roomName", {
        status: 400,
      });
    }
    if (participantName === null) {
      return new NextResponse(
        "Missing required query parameter: participantName",
        { status: 400 },
      );
    }
    if (!metadata) {
      return new NextResponse("Missing required query parameter: metadata", {
        status: 400,
      });
    }

    // Parse metadata and extract fid/address if present
    let parsedMetadata: ParticipantMetadata;
    try {
      parsedMetadata = JSON.parse(metadata);
    } catch {
      return new NextResponse("Invalid metadata JSON", { status: 400 });
    }

    // Security: Only allow known users to join or create spaces
    let user;
    if (parsedMetadata.fid) {
      user = await prisma.user.findUnique({
        where: { fid: parsedMetadata.fid },
      });
    } else if (parsedMetadata.address) {
      user = await prisma.user.findFirst({
        where: { address: parsedMetadata.address },
      });
    } else if (parsedMetadata.username) {
      user = await prisma.user.findFirst({
        where: { username: parsedMetadata.username },
      });
    }
    if (!user) {
      return new NextResponse("User not found in database", { status: 403 });
    }

    let space;
    if (isHost) {
      // Host: Create the space if it doesn't exist, else return error
      space = await prisma.space.findUnique({
        where: { livekitName: roomName },
      });
      if (!space) {
        // Require title in metadata for space creation
        if (!parsedMetadata.spaceTitle) {
          return new NextResponse("Missing space title in metadata", {
            status: 400,
          });
        }
        // Create the space
        space = await prisma.space.create({
          data: {
            livekitName: roomName,
            title: parsedMetadata.spaceTitle,
            hostId: user.id,
            hostAddress: user.address ?? "",
            status: "LIVE",
          },
        });
      }
      // Ensure host is a participant in the space
      await prisma.participant.upsert({
        where: {
          spaceId_fid: {
            spaceId: space.id,
            fid: user.fid!,
          },
        },
        update: {
          role: Role.HOST,
        },
        create: {
          spaceId: space.id,
          fid: user.fid!,
          role: Role.HOST,
        },
      });
    } else {
      // Not host: Just fetch the space
      space = await prisma.space.findUnique({
        where: { livekitName: roomName },
      });
      if (!space) {
        return new NextResponse("Space not found", { status: 404 });
      }
      // Ensure user is a participant (add if not present)
      await prisma.participant.upsert({
        where: {
          spaceId_fid: {
            spaceId: space.id,
            fid: user.fid!,
          },
        },
        update: {},
        create: {
          spaceId: space.id,
          fid: user.fid!,
          role: Role.LISTENER,
        },
      });
    }

    // Always include the space title in the metadata for token generation
    const metadataWithTitle = {
      ...parsedMetadata,
      isHost,
      title: space.title,
    };

    // Generate participant token
    if (!randomParticipantPostfix) {
      randomParticipantPostfix = randomString(4);
    }
    const participantToken = await createParticipantToken(
      {
        identity: `${participantName}__${randomParticipantPostfix}`,
        name: participantName,
        metadata: JSON.stringify(metadataWithTitle),
      },
      roomName,
      isHost,
    );

    // Return connection details
    const data: ConnectionDetails = {
      serverUrl: livekitServerUrl,
      roomName: roomName,
      participantToken: participantToken,
      participantName: participantName,
    };
    return new NextResponse(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": `${COOKIE_KEY}=${randomParticipantPostfix}; Path=/; HttpOnly; SameSite=Strict; Secure; Expires=${getCookieExpirationTime()}`,
      },
    });
  } catch (error) {
    // Log error for debugging
    console.error("Error in /api/connection-details:", error);
    if (error instanceof Error) {
      return new NextResponse(error.message, { status: 500 });
    }
    return new NextResponse("Internal server error", { status: 500 });
  } finally {
    // Clean up Prisma connection
    await prisma.$disconnect();
  }
}

/**
 * Generates a LiveKit participant token with appropriate grants.
 */
function createParticipantToken(
  userInfo: AccessTokenOptions,
  roomName: string,
  host: boolean,
) {
  const at = new AccessToken(API_KEY, API_SECRET, userInfo);
  at.ttl = "5m";
  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: host,
    canPublishData: true,
    canSubscribe: true,
    canUpdateOwnMetadata: true,
    canPublishSources: [TrackSource.MICROPHONE],
  };
  at.addGrant(grant);
  return at.toJwt();
}

/**
 * Returns a cookie expiration time string (2 hours from now).
 */
function getCookieExpirationTime(): string {
  const now = new Date();
  const time = now.getTime();
  const expireTime = time + 60 * 120 * 1000;
  now.setTime(expireTime);
  return now.toUTCString();
}
