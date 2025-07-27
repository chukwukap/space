import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// POST /api/space/rug
export async function POST(req: NextRequest) {
  const { roomName } = await req.json();
  if (!roomName) {
    return NextResponse.json({ error: "Missing roomName" }, { status: 400 });
  }

  // Validate that the user is the host of this room
  const space = await prisma.space.findUnique({
    where: { livekitName: roomName },
  });
  if (!space) {
    return NextResponse.json({ error: "Space not found" }, { status: 404 });
  }

  try {
    await prisma.space.update({
      where: { livekitName: roomName },
      data: { status: "ENDED" },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to rug space" }, { status: 500 });
  }
}
