import AudioRoom from "@/app/components/audioRoom";
import { generateAccessToken, ensureRoom, livekitWsUrl } from "@/lib/livekit";
import { randomUUID } from "crypto";

interface RoomPageProps {
  params: {
    room: string;
  };
}

export const revalidate = 0; // always render on demand

export default async function RoomPage({ params }: RoomPageProps) {
  const roomName = params.room;
  const userId = randomUUID();

  await ensureRoom(roomName);
  const token = await generateAccessToken({ roomName, userId });

  return <AudioRoom token={token} serverUrl={livekitWsUrl} />;
}
