"use server";

import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/generated/prisma";
import { revalidatePath } from "next/cache";

/**
 * Create a new participant in a space.
 * Throws if participant already exists for the given space and fid.
 */
export async function createParticipant({
  spaceId,
  fid,
  role,
}: {
  spaceId: string;
  fid: number;
  role: Role;
}) {
  // Security: Prevent duplicate participant
  const existing = await prisma.participant.findUnique({
    where: { spaceId_fid: { spaceId, fid } },
  });
  if (existing) {
    throw new Error("Participant already exists in this space.");
  }
  const participant = await prisma.participant.create({
    data: {
      spaceId,
      fid,
      role,
    },
  });
  revalidatePath(`/space/${spaceId}`);
  return participant;
}

/**
 * Get a participant by spaceId and fid.
 */
export async function getParticipant({
  spaceId,
  fid,
}: {
  spaceId: string;
  fid: number;
}) {
  return prisma.participant.findUnique({
    where: { spaceId_fid: { spaceId, fid } },
    include: { user: true, space: true },
  });
}

/**
 * Get all participants in a space.
 */
export async function getParticipantsBySpace(spaceId: string) {
  return prisma.participant.findMany({
    where: { spaceId },
    include: { user: true },
    orderBy: { joinedAt: "asc" },
  });
}

/**
 * Get all spaces a user is participating in.
 */
export async function getSpacesByFid(fid: number) {
  return prisma.participant.findMany({
    where: { fid },
    include: { space: true },
    orderBy: { joinedAt: "desc" },
  });
}

/**
 * Update a participant's role.
 * Throws if participant not found.
 */
export async function updateParticipantRole({
  spaceId,
  fid,
  role,
}: {
  spaceId: string;
  fid: number;
  role: Role;
}) {
  const participant = await prisma.participant.update({
    where: { spaceId_fid: { spaceId, fid } },
    data: { role },
  });
  revalidatePath(`/space/${spaceId}`);
  return participant;
}

/**
 * Mark a participant as having left the space (sets leftAt).
 * Throws if participant not found.
 */
export async function leaveParticipant({
  spaceId,
  fid,
}: {
  spaceId: string;
  fid: number;
}) {
  const participant = await prisma.participant.update({
    where: { spaceId_fid: { spaceId, fid } },
    data: { leftAt: new Date() },
  });
  revalidatePath(`/space/${spaceId}`);
  return participant;
}

/**
 * Remove a participant from a space (delete).
 * Throws if participant not found.
 */
export async function removeParticipant({
  spaceId,
  fid,
}: {
  spaceId: string;
  fid: number;
}) {
  const participant = await prisma.participant.delete({
    where: { spaceId_fid: { spaceId, fid } },
  });
  revalidatePath(`/space/${spaceId}`);
  return participant;
}

/**
 * Promote a participant to a new role (e.g., from LISTENER to SPEAKER).
 * Throws if participant not found.
 */
export async function promoteParticipant({
  spaceId,
  fid,
  newRole,
}: {
  spaceId: string;
  fid: number;
  newRole: Role;
}) {
  // Only allow promotion to COHOST or SPEAKER
  if (newRole !== "COHOST" && newRole !== "SPEAKER") {
    throw new Error("Invalid promotion role.");
  }
  const participant = await prisma.participant.update({
    where: { spaceId_fid: { spaceId, fid } },
    data: { role: newRole },
  });
  revalidatePath(`/space/${spaceId}`);
  return participant;
}

/**
 * Demote a participant to a new role (e.g., from SPEAKER to LISTENER).
 * Throws if participant not found.
 */
export async function demoteParticipant({
  spaceId,
  fid,
  newRole,
}: {
  spaceId: string;
  fid: number;
  newRole: Role;
}) {
  // Only allow demotion to LISTENER
  if (newRole !== "LISTENER") {
    throw new Error("Invalid demotion role.");
  }
  const participant = await prisma.participant.update({
    where: { spaceId_fid: { spaceId, fid } },
    data: { role: newRole },
  });
  revalidatePath(`/space/${spaceId}`);
  return participant;
}

/**
 * Check if a user is a participant in a space.
 */
export async function isParticipant({
  spaceId,
  fid,
}: {
  spaceId: string;
  fid: number;
}) {
  const participant = await prisma.participant.findUnique({
    where: { spaceId_fid: { spaceId, fid } },
  });
  return !!participant;
}

/**
 * Get the current role of a participant.
 */
export async function getParticipantRole({
  spaceId,
  fid,
}: {
  spaceId: string;
  fid: number;
}) {
  const participant = await prisma.participant.findUnique({
    where: { spaceId_fid: { spaceId, fid } },
    select: { role: true },
  });
  return participant?.role ?? null;
}

/**
 * Get all participants with a specific role in a space.
 */
export async function getParticipantsByRole({
  spaceId,
  role,
}: {
  spaceId: string;
  role: Role;
}) {
  return prisma.participant.findMany({
    where: { spaceId, role },
    include: { user: true },
    orderBy: { joinedAt: "asc" },
  });
}

/**
 * Remove all participants from a space (e.g., when ending a space).
 * Use with caution.
 */
export async function removeAllParticipants(spaceId: string) {
  const deleted = await prisma.participant.deleteMany({
    where: { spaceId },
  });
  revalidatePath(`/space/${spaceId}`);
  return deleted;
}

/**
 * Get the count of participants in a space.
 */
export async function getParticipantCount(spaceId: string) {
  return prisma.participant.count({
    where: { spaceId, leftAt: null },
  });
}

/**
 * Get all active (not left) participants in a space.
 */
export async function getActiveParticipants(spaceId: string) {
  return prisma.participant.findMany({
    where: { spaceId, leftAt: null },
    include: { user: true },
    orderBy: { joinedAt: "asc" },
  });
}

/**
 * Get all participants who have left a space.
 */
export async function getLeftParticipants(spaceId: string) {
  return prisma.participant.findMany({
    where: { spaceId, leftAt: { not: null } },
    include: { user: true },
    orderBy: { leftAt: "desc" },
  });
}

/**
 * Rejoin a participant (clear leftAt).
 * Throws if participant not found.
 */
export async function rejoinParticipant({
  spaceId,
  fid,
}: {
  spaceId: string;
  fid: number;
}) {
  const participant = await prisma.participant.update({
    where: { spaceId_fid: { spaceId, fid } },
    data: { leftAt: null },
  });
  revalidatePath(`/space/${spaceId}`);
  return participant;
}
