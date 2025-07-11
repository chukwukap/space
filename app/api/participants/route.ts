import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { fid, username, pfpUrl, walletAddress } = await req.json();

    if (!fid && !walletAddress) {
      return NextResponse.json(
        { error: "Provide at least fid or walletAddress" },
        { status: 400 },
      );
    }

    // Build OR conditions
    const ors: Record<string, unknown>[] = [];
    if (fid) ors.push({ fid: Number(fid) });
    if (walletAddress) ors.push({ address: walletAddress.toLowerCase() });
    if (username)
      ors.push({ username: { equals: username, mode: "insensitive" } });

    const where = { OR: ors } as const;

    let user = await prisma.user.findFirst({ where });

    if (user) {
      // update pfp or wallet if missing
      const data: Record<string, unknown> = {};
      if (pfpUrl && !user.avatarUrl) data.avatarUrl = pfpUrl;
      if (walletAddress && !user.address)
        data.address = walletAddress.toLowerCase();
      if (Object.keys(data).length) {
        user = await prisma.user.update({ where: { id: user.id }, data });
      }
    } else {
      const createData: Record<string, unknown> = {
        username,
        avatarUrl: pfpUrl,
      };
      if (fid) createData.fid = Number(fid);
      if (walletAddress) createData.address = walletAddress.toLowerCase();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      user = await prisma.user.create({ data: createData as any });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("[POST /api/participants]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
