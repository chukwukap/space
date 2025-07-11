import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/* GET /api/tips?spaceId= */
export async function GET(req: NextRequest) {
  const spaceId = req.nextUrl.searchParams.get("spaceId");
  try {
    const tips = await prisma.tip.findMany({
      where: spaceId ? { spaceId } : {},
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json(tips);
  } catch (error) {
    console.error("[GET /api/tips]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

/* POST /api/tips */
export async function POST(req: NextRequest) {
  try {
    const { spaceId, fromId, toId, amount, tokenSymbol, txHash, reactionId } =
      await req.json();

    if (!spaceId || !fromId || !toId || !amount || !tokenSymbol || !txHash) {
      return NextResponse.json({ error: "missing fields" }, { status: 400 });
    }

    const tip = await prisma.tip.create({
      data: {
        spaceId,
        fromId,
        toId,
        amount,
        tokenSymbol,
        txHash,
        reaction: reactionId ? { connect: { id: reactionId } } : undefined,
      },
    });

    return NextResponse.json(tip);
  } catch (error) {
    console.error("[POST /api/tips]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
