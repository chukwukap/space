"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { roomService } from "@/lib/livekit";
import type { SpaceMetadata } from "@/lib/types";

/**
 * Zod schema for validating ParticipantMetadata.
 * This mirrors the ParticipantMetadata type for runtime validation.
 */
const ParticipantMetadataSchema = z.object({
  fid: z.number(),
  address: z.string(),
  displayName: z.string(),
  username: z.string(),
  pfpUrl: z.string(),
  identity: z.number(),
  clientFid: z.number().nullable(),
  isHost: z.boolean().nullable(),
  handRaised: z.boolean().optional(),
});

/**
 * Zod schema for validating SpaceMetadata.
 * This mirrors the SpaceMetadata type for runtime validation.
 */
const SpaceMetadataSchema = z.object({
  clientFid: z.number().nullable(),
  title: z.string(),
  host: ParticipantMetadataSchema,
  recording: z.boolean(),
  ended: z.boolean(),
});

const UpdateRoomMetadataSchema = z.object({
  roomName: z.string().min(1),
  metadata: SpaceMetadataSchema,
});

/**
 * Server action to update LiveKit room metadata securely.
 * Only the host (or authorized user) should be able to update.
 * @param formData - The data containing roomName and metadata (SpaceMetadata)
 */
export async function updateLivekitRoomMetadata(formData: unknown) {
  // Validate input against the SpaceMetadata and ParticipantMetadata types
  const parsed = UpdateRoomMetadataSchema.safeParse(formData);
  if (!parsed.success) {
    // Use zod's recommended error tree format for modern error handling
    const errorTree = z.treeifyError(parsed.error);
    return { error: "Invalid input", details: errorTree };
  }
  const { roomName, metadata } = parsed.data as {
    roomName: string;
    metadata: SpaceMetadata;
  };

  try {
    // Use minikit's LiveKit wrapper to update room metadata
    await roomService.updateRoomMetadata(roomName, JSON.stringify(metadata));

    // Revalidate the space page for fresh data
    revalidatePath(`/space/${roomName}`);

    return { success: true };
  } catch (err) {
    console.error("[updateLivekitRoomMetadata]", err);
    return { error: "Failed to update room metadata" };
  }
}
