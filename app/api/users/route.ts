/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
function sanitizeString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

/* ------------------------------------------------------------------ */
/* GET /api/user                                                       */
/* ------------------------------------------------------------------ */
// Query params supported: id, fid, address, username
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = sanitizeString(searchParams.get("id"));
    const fid = sanitizeString(searchParams.get("fid"));
    const address = sanitizeString(searchParams.get("address"));
    const username = sanitizeString(searchParams.get("username"));

    if (!id && !fid && !address && !username) {
      return NextResponse.json(
        { error: "Provide one of id, fid, address or username" },
        { status: 400 },
      );
    }

    const ors: unknown[] = [];
    if (id) ors.push({ id: Number(id) });
    if (fid) ors.push({ fid: Number(fid) });
    if (address) ors.push({ address: address.toLowerCase() });
    if (username)
      ors.push({
        username: {
          equals: username,
          mode: "insensitive",
        },
      });

    const user = await prisma.user.findFirst({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      where: { OR: ors as any },
      include: { tipsSent: true, tipsReceived: true },
    });

    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json(user);
  } catch (error) {
    console.error("[GET /api/user]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/* POST /api/user                                                      */
/* ------------------------------------------------------------------ */
// Upsert user. Accepts: fid, address, username, avatarUrl, displayName
export async function POST(req: NextRequest) {
  try {
    const { fid, address, username, avatarUrl, displayName } = await req.json();

    if (!fid && !address && !username) {
      return NextResponse.json(
        {
          error:
            "At least one unique identifier (fid, address or username) required",
        },
        { status: 400 },
      );
    }

    // Normalise address to lowercase
    const normAddress: string | undefined = address
      ? address.toLowerCase()
      : undefined;

    // Try to locate existing user
    const ors2: unknown[] = [];
    if (fid) ors2.push({ fid: Number(fid) });
    if (normAddress) ors2.push({ address: normAddress });
    if (username)
      ors2.push({
        username: {
          equals: username,
          mode: "insensitive",
        },
      });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = await prisma.user.findFirst({
      where: { OR: ors2 as any },
    });

    let user: unknown;
    if (existing) {
      user = await prisma.user.update({
        where: { id: existing.id },
        data: {
          avatarUrl: sanitizeString(avatarUrl),
          displayName: sanitizeString(displayName),
          address: normAddress ?? existing.address,
          username: username ?? existing.username,
        },
        include: { tipsSent: true, tipsReceived: true },
      });
    } else {
      user = await prisma.user.create({
        data: {
          fid: fid ? Number(fid) : 0,
          address: normAddress ?? "",
          username: username ?? "",
          displayName: sanitizeString(displayName),
          avatarUrl: sanitizeString(avatarUrl),
        },
        include: { tipsSent: true, tipsReceived: true },
      });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("[POST /api/user]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/* PATCH /api/user                                                     */
/* ------------------------------------------------------------------ */
// Accepts userId and fields to update (address, avatarUrl, displayName, username)
export async function PATCH(req: NextRequest) {
  try {
    const { userId, address, avatarUrl, displayName, username } =
      await req.json();

    if (!userId)
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 },
      );

    const data: Record<string, unknown> = {};
    if (address) data.address = (address as string).toLowerCase();
    if (avatarUrl) data.avatarUrl = sanitizeString(avatarUrl);
    if (displayName) data.displayName = sanitizeString(displayName);
    if (username) data.username = username;

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    const updated = await prisma.user.update({
      where: { id: Number(userId) },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PATCH /api/user]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
