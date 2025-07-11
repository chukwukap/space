import { roomService as spaceService } from "@/lib/livekit";
import { SpaceSummary } from "@/lib/types";
import { prisma } from "@/lib/prisma";

export const revalidate = 0;

export async function GET() {
  const spaces = await spaceService.listRooms();
  const data = await Promise.all(
    spaces.map(async (space) => {
      // // Fetch up to 3 participant identities for avatar rendering
      // let identities: string[] = [];
      // try {
      //   const list = await roomService.listParticipants(r.name);
      //   identities = list.slice(0, 3).map((p) => p.identity ?? "");
      // } catch {
      //   // ignore errors (e.g., room expired between list calls)
      // }

      const spaceSummary: SpaceSummary = {
        id: space.name,
        title: space.metadata ?? "",
        listeners: space.numParticipants ?? 0,
        hostName: space.metadata ?? "",
        hostRole: "Host",
        hostBio: space.metadata ?? "",
        avatars: [],
      };

      return spaceSummary;
    }),
  );

  return Response.json(data);
}

export async function POST(request: Request) {
  try {
    const {
      title,
      hostId,
      recording = false,
    } = (await request.json()) as {
      title?: string;
      hostId?: number;
      recording?: boolean;
    };

    if (!title || !hostId) {
      return new Response(
        JSON.stringify({ error: "title and hostId required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const id = crypto.randomUUID();

    // Ensure LiveKit room exists
    await spaceService.createRoom({ name: id, metadata: title });

    // Persist in DB
    const space = await prisma.space.create({
      data: {
        id,
        title,
        hostId,
        recording,
        status: "LIVE",
      },
    });

    return new Response(JSON.stringify(space), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[POST /api/spaces]", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
