import SpaceRoom from "./_components/spaceRoom";
import { ensureRoom, livekitWsUrl } from "@/lib/livekit";

export const revalidate = 0;

export default async function SpacePage({
  params,
  searchParams,
}: {
  params: Promise<{ spaceId: string }>;
  searchParams: Promise<{ title?: string }>;
}) {
  const { spaceId } = await params;

  const { title } = await searchParams;
  const decodedTitle = title ? decodeURIComponent(title) : "N/A";

  await ensureRoom(spaceId);

  return (
    <SpaceRoom
      serverUrl={livekitWsUrl}
      spaceId={spaceId}
      title={decodedTitle}
    />
  );
}
