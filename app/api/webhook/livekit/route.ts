import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const event = await req.json();
  if (event.event !== "egress_ended") return new Response("ok");
  const roomName = event.room_name;
  const location = event.file?.location;
  if (!roomName || !location) return new Response("bad", { status: 400 });
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  await prisma.space.update({
    where: { id: roomName },
    data: { status: "ENDED" },
  });
  // recordingUrl column added; ignore TS until prisma re-generated
  await prisma.$executeRawUnsafe(
    `UPDATE "Space" SET "recordingUrl" = $1 WHERE id = $2`,
    location,
    roomName,
  );
  return new Response("ok");
}
