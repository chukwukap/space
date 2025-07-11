import AudioRoom from "@/app/components/spaceRoom";
import { ensureRoom, generateAccessToken, livekitWsUrl } from "@/lib/livekit";
import { randomUUID } from "crypto";

export const revalidate = 0;

export default async function SpacePage({
  params,
  searchParams,
}: {
  params: { space: string };
  searchParams: { title?: string; fid?: string; username?: string };
}) {
  const { space: spaceName } = params;

  console.log("spaceName", spaceName);
  const title = searchParams.title
    ? decodeURIComponent(searchParams.title)
    : undefined;

  console.log("title", title);

  const fid = searchParams.fid ? Number(searchParams.fid) : undefined;
  const username = searchParams.username;

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
