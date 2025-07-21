import { roomService } from "@/lib/livekit";
import PageClientImpl from "./pageClient";

export default async function SpacePage({
  params,
  searchParams,
}: {
  params: Promise<{ roomName: string }>;
  searchParams: Promise<{ hq?: string; region?: string; title?: string }>;
}) {
  const _params = await params;
  const _searchParams = await searchParams;

  const hq = _searchParams.hq === "true" ? true : false;

  const isHost = await roomService
    .listRooms([_params.roomName])
    .then((rooms) => {
      return rooms.some((room) => room.name === _params.roomName);
    });

  return (
    <PageClientImpl
      roomName={_params.roomName}
      region={_searchParams.region}
      hq={hq}
      isHost={isHost}
      title={_searchParams.title ?? "Untitled Space"}
    />
  );
}
