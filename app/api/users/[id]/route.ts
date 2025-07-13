import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(params.id) },
      include: { tipsSent: true, tipsReceived: true, participants: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch (error) {
    console.error("[GET /api/user/:id]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const body = await req.json();
    const { address, avatarUrl, displayName, username } = body;

    const data: Record<string, unknown> = {};
    if (address) data.address = (address as string).toLowerCase();
    if (avatarUrl) data.avatarUrl = avatarUrl;
    if (displayName) data.displayName = displayName;
    if (username) data.username = username;

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: Number(params.id) },
      data,
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("[PATCH /api/user/:id]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
