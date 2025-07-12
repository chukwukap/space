import SpaceRoom from "./_components/spaceRoom";
import { livekitWsUrl } from "@/lib/livekit";

export const revalidate = 0;

export default async function SpacePage({
  params,
}: {
  params: Promise<{ spaceId: string }>;
}) {
  const { spaceId } = await params;

  return <SpaceRoom serverUrl={livekitWsUrl} spaceId={spaceId} />;
}
