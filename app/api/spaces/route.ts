import { listActiveRooms } from "@/lib/livekit";

export const revalidate = 0;

export async function GET() {
  type LKRoom = {
    name: string;
    numParticipants?: number;
    participantCount?: number;
    metadata?: string;
  };
  const rooms = (await listActiveRooms()) as LKRoom[];
  return Response.json(
    rooms.map((r) => ({
      name: r.name,
      title: r.metadata ?? undefined,
      participants: r.numParticipants ?? r.participantCount ?? 0,
    })),
  );
}
