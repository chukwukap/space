import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/* POST /api/reactions */
export async function POST(req: NextRequest) {
  try {
    const { spaceId, userId, type, tipId } = await req.json();
    if (!spaceId || !userId || !type) {
      return NextResponse.json({ error: "missing fields" }, { status: 400 });
    }

    const reaction = await prisma.reaction.create({
      data: {
        spaceId,
        userId,
        type,
        tipId,
      },
    });
    return NextResponse.json(reaction);
  } catch (error) {
    console.error("[POST /api/reactions]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
