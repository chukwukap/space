import SpaceRoom from "./_components/spaceRoom";
import { roomService } from "@/lib/livekit";
import { Room } from "livekit-server-sdk";
import { SpaceMetadata } from "@/lib/types";

export const revalidate = 0;

export default async function SpacePage({
  params,
}: {
  params: Promise<{ spaceId: string; title: string }>;
}) {
  const { spaceId, title } = await params;
  let serverRoom: Room | undefined;
  let metadata: SpaceMetadata | undefined;
  try {
    const spaces = await roomService.listRooms([spaceId]);
    console.log("spaceWithHost", JSON.stringify(spaces, null, 2));
    serverRoom = spaces[0];
    metadata = JSON.parse(serverRoom.metadata) as SpaceMetadata;
  } catch (error) {
    console.error("[GET] error:", error);
    return (
      <div>
        <p>Could not load this space. Please try again later.</p>
      </div>
    );
  }

  if (!serverRoom) {
    return <div>Space not found</div>;
  }

  if (!metadata) {
    return <div>Could not load this space. Please try again later.</div>;
  }

  if (metadata.ended) {
    return <div>This space has already ended</div>;
  }

  return (
    <SpaceRoom
      serverRoom={serverRoom}
      title={decodeURIComponent(title)}
      roomMetadata={metadata}
    />
  );
}
