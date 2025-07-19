import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma";

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */
/**
 * Sanitizes a value to a non-empty string or undefined.
 */
function sanitizeString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

/* ------------------------------------------------------------------ */
/* GET /api/user                                                      */
/* ------------------------------------------------------------------ */
// Query params supported: id, fid, address, username
export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const id = sanitizeString(params.get("id"));
    const fid = sanitizeString(params.get("fid"));
    const address = sanitizeString(params.get("address"));
    const username = sanitizeString(params.get("username"));

    // Log all query param values
    console.log("[GET /api/user] Query Params:", {
      id,
      fid,
      address,
      username,
    });

    if (!id && !fid && !address && !username) {
      console.log("[GET /api/user] No identifier provided");
      return NextResponse.json(
        { error: "Provide one of id, fid, address or username" },
        { status: 400 },
      );
    }

    const ors: Prisma.UserWhereInput[] = [];
    if (id) ors.push({ id: Number(id) });
    if (fid) ors.push({ fid: Number(fid) });
    if (address) ors.push({ address: address });
    if (username)
      ors.push({
        username: {
          equals: username,
          mode: "insensitive",
        },
      });

    // Log the constructed OR conditions
    console.log("[GET /api/user] Prisma OR conditions:", JSON.stringify(ors));

    const user = await prisma.user.findFirst({
      where: { OR: ors },
      include: { tipsSent: true, tipsReceived: true },
    });

    // Log the user result
    console.log("[GET /api/user] User found:", user);

    if (!user) {
      console.log("[GET /api/user] User not found");
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("[GET /api/user] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/* POST /api/user                                                     */
/* ------------------------------------------------------------------ */
// Upsert user. Accepts: fid, address, username, avatarUrl, displayName
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fid, address, username, avatarUrl, displayName } = body;

    // Log all incoming POST body values
    console.log("[POST /api/user] Body:", {
      fid,
      address,
      username,
      avatarUrl,
      displayName,
    });

    if (!fid && !address && !username) {
      console.log("[POST /api/user] No unique identifier provided");
      return NextResponse.json(
        {
          error:
            "At least one unique identifier (fid, address or username) required",
        },
        { status: 400 },
      );
    }

    const normAddress: string | undefined = address ? address : undefined;

    const ors2: Prisma.UserWhereInput[] = [];
    if (fid) ors2.push({ fid: Number(fid) });
    if (normAddress) ors2.push({ address: normAddress });
    if (username)
      ors2.push({
        username: {
          equals: username,
          mode: "insensitive",
        },
      });

    // Log the constructed OR conditions for upsert
    console.log("[POST /api/user] Prisma OR conditions:", JSON.stringify(ors2));

    const existing = await prisma.user.findFirst({
      where: { OR: ors2 },
    });

    // Log the existing user if found
    console.log("[POST /api/user] Existing user:", existing);

    let user;
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
      // Log the update operation
      console.log("[POST /api/user] Updated user:", user);
    } else {
      user = await prisma.user.create({
        data: {
          fid: fid ? Number(fid) : null,
          address: normAddress ?? "",
          username: username ?? "",
          displayName: sanitizeString(displayName),
          avatarUrl: sanitizeString(avatarUrl),
        },
        include: { tipsSent: true, tipsReceived: true },
      });
      // Log the create operation
      console.log("[POST /api/user] Created user:", user);
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("[POST /api/user] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/* PATCH /api/user                                                    */
/* ------------------------------------------------------------------ */
// Accepts userId and fields to update (address, avatarUrl, displayName, username)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, address, avatarUrl, displayName, username } = body;

    // Log all incoming PATCH body values
    console.log("[PATCH /api/user] Body:", {
      userId,
      address,
      avatarUrl,
      displayName,
      username,
    });

    if (!userId) {
      console.log("[PATCH /api/user] userId missing");
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 },
      );
    }

    const data: Record<string, unknown> = {};
    if (address) data.address = address;
    if (avatarUrl) data.avatarUrl = sanitizeString(avatarUrl);
    if (displayName) data.displayName = sanitizeString(displayName);
    if (username) data.username = username;

    // Log the update data object
    console.log("[PATCH /api/user] Update data:", data);

    if (Object.keys(data).length === 0) {
      console.log("[PATCH /api/user] No valid fields to update");
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    const updated = await prisma.user.update({
      where: { id: Number(userId) },
      data,
    });

    // Log the updated user
    console.log("[PATCH /api/user] Updated user:", updated);

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PATCH /api/user] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
