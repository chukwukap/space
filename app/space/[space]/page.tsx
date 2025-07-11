import AudioRoom from "@/app/components/audioRoom";
import { ensureRoom, generateAccessToken, livekitWsUrl } from "@/lib/livekit";
import { randomUUID } from "crypto";

export const revalidate = 0;

export default async function SpacePage({
  params,
  searchParams,
}: {
  params: { space: string };
  searchParams: { title?: string };
}) {
  const spaceName = params.space;
  console.log("spaceName", spaceName);
  const title = searchParams.title
    ? decodeURIComponent(searchParams.title)
    : undefined;

  const userId = randomUUID();

  await ensureRoom(spaceName);
  const token = await generateAccessToken({ roomName: spaceName, userId });

  return (
    <AudioRoom
      token={token}
      serverUrl={livekitWsUrl}
      title={title ?? spaceName}
    />
  );
}
