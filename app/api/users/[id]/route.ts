import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma";

/**
 * Helper to sanitize a value to a non-empty string or undefined.
 */
function sanitizeString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

/**
 * GET /api/users/[id]
 * Supports lookup by id or username via query params (?id=, ?username=)
 */
export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const id = sanitizeString(params.get("id"));
    const username = sanitizeString(params.get("username"));

    if (!id && !username) {
      return NextResponse.json(
        { error: "Provide one of id or username" },
        { status: 400 },
      );
    }

    // Build OR query for id or username
    const ors: Prisma.UserWhereInput[] = [];

    if (id) ors.push({ id: Number(id) });
    if (username)
      ors.push({
        username: {
          equals: username,
          mode: "insensitive",
        },
      });

    const user = await prisma.user.findFirst({
      where: { OR: ors },
      include: {
        tipsSent: true,
        tipsReceived: true,
        participants: true,
        hostedSpaces: true,
        reactions: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch (error) {
    console.error("[GET /api/users/[id]]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/users/[id]
 * Allows updating user by id or username (must provide at least one as query param)
 * Accepts: address, avatarUrl, displayName, username in body
 */
export async function PATCH(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const id = sanitizeString(params.get("id"));
    const usernameParam = sanitizeString(params.get("username"));
    const body = await req.json();
    const { address, avatarUrl, displayName, username } = body;

    if (!id && !usernameParam) {
      return NextResponse.json(
        { error: "Provide one of id or username as query param" },
        { status: 400 },
      );
    }

    // Build OR query for id or username
    const ors: Prisma.UserWhereInput[] = [];
    if (id) ors.push({ id: Number(id) });
    if (usernameParam)
      ors.push({
        username: {
          equals: usernameParam,
          mode: "insensitive",
        },
      });

    // Find the user first
    const user = await prisma.user.findFirst({
      where: { OR: ors },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prepare update data
    const data: Record<string, unknown> = {};
    if (address) data.address = address;
    if (avatarUrl) data.avatarUrl = sanitizeString(avatarUrl);
    if (displayName) data.displayName = sanitizeString(displayName);
    if (username) data.username = username;

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    // Update user by id (guaranteed unique)
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data,
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("[PATCH /api/users/[id]]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
