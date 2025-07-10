import { listActiveRooms } from "@/lib/livekit";

export const revalidate = 0;

export async function GET() {
  const rooms = await listActiveRooms();
  return Response.json(
    rooms.map((r) => ({
      name: r.name,
      participants: r.numParticipants ?? 0,
    })),
  );
}
