import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Handles participant creation or update for Spaces.
 * Ensures at least one unique identifier (fid or walletAddress) is provided.
 * Security-first: Only allows safe, minimal updates to user records.
 */
export async function POST(req: NextRequest) {
  try {
    const { fid, username, pfpUrl, walletAddress } = await req.json();

    // Require at least one unique identifier for user creation or lookup
    if (!fid && !walletAddress) {
      return NextResponse.json(
        { error: "Provide at least fid or walletAddress" },
        { status: 400 },
      );
    }

    // Build OR conditions for user lookup
    const ors: Array<
      Record<string, string | number | { equals: string; mode: "insensitive" }>
    > = [];
    if (fid) ors.push({ fid: Number(fid) });
    if (walletAddress) ors.push({ address: walletAddress.toLowerCase() });
    if (username)
      ors.push({ username: { equals: username, mode: "insensitive" } });

    const where = { OR: ors };

    let user = await prisma.user.findFirst({ where });

    if (user) {
      // Prepare update data only for missing fields
      const updateData: Partial<{
        avatarUrl: string;
        address: string;
      }> = {};
      if (pfpUrl && !user.avatarUrl) updateData.avatarUrl = pfpUrl;
      if (walletAddress && !user.address)
        updateData.address = walletAddress.toLowerCase();

      // Only update if there is something to update
      if (Object.keys(updateData).length > 0) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });
      }
    } else {
      // Enforce required fields for user creation
      if (!fid || !walletAddress) {
        return NextResponse.json(
          { error: "Both fid and walletAddress are required for new users." },
          { status: 400 },
        );
      }

      // Construct the create data with correct types
      const createData: {
        fid: number;
        address: string;
        username?: string;
        avatarUrl?: string;
      } = {
        fid: Number(fid),
        address: walletAddress.toLowerCase(),
      };
      if (username) createData.username = username;
      if (pfpUrl) createData.avatarUrl = pfpUrl;

      user = await prisma.user.create({ data: createData });
    }

    return NextResponse.json(user);
  } catch (error) {
    // Log error for observability and debugging
    console.error("[POST /api/participants]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
