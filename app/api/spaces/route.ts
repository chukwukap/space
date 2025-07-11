import { listActiveRooms, roomService } from "@/lib/livekit";

export const revalidate = 0;

export async function GET() {
  type LKRoom = {
    name: string;
    numParticipants?: number;
    participantCount?: number;
    metadata?: string;
  };
  const rooms = (await listActiveRooms()) as LKRoom[];
  const data = await Promise.all(
    rooms.map(async (r) => {
      // Fetch up to 3 participant identities for avatar rendering
      let identities: string[] = [];
      try {
        const list = await roomService.listParticipants(r.name);
        identities = list.slice(0, 3).map((p) => p.identity ?? "");
      } catch {
        // ignore errors (e.g., room expired between list calls)
      }

      return {
        name: r.name,
        title: r.metadata ?? undefined,
        participants: r.numParticipants ?? r.participantCount ?? 0,
        identities,
      };
    }),
  );

  return Response.json(data);
}
