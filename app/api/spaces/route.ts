import { listActiveRooms } from "@/lib/livekit";

export const revalidate = 0;

export async function GET() {
  type LKRoom = {
    name: string;
    numParticipants?: number;
    participantCount?: number;
  };
  const rooms = (await listActiveRooms()) as LKRoom[];
  return Response.json(
    rooms.map((r) => ({
      name: r.name,
      participants: r.numParticipants ?? r.participantCount ?? 0,
    })),
  );
}
