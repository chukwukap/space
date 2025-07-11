import { roomService as spaceService } from "@/lib/livekit";
import { SpaceSummary } from "@/lib/types";

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
