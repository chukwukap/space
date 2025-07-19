import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/* POST /api/reactions */
export async function POST(req: NextRequest) {
  try {
    const { spaceId, userId, type, receiverId } = await req.json();
    if (!spaceId || !userId || !type || !receiverId) {
      return NextResponse.json({ error: "missing fields" }, { status: 400 });
    }

    const tip = await prisma.tip.create({
      data: {
        spaceId,
        from: {
          connect: {
            fid: userId,
          },
        },
        to: {
          connect: {
            fid: receiverId,
          },
        },
        amount: 0,
        tokenSymbol: "USDC",
        txHash: "",
        space: {
          connect: {
            id: spaceId,
          },
        },
      },
    });

    const reaction = await prisma.reaction.create({
      data: {
        spaceId,
        userId,
        type,
        tipId: tip.id,
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
