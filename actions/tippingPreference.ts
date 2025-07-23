"use server";

import prisma from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { revalidatePath } from "next/cache";
import type { Address } from "viem";
import { z } from "zod";

/**
 * Server action to update tipping preferences for the current user.
 * Accepts a payload with all tip settings and global enabled state.
 * Returns the updated preferences or throws on error.
 *
 * NOTE: The TippingPreferences model requires token and chainId fields on creation.
 * These must be provided on first creation. For now, we default to USDC and mainnet (1).
 * In production, these should be passed from the client or inferred from user context.
 */
export const updateTippingPreferences = async (
  formData: {
    tippingEnabled: boolean;
    heart: { enabled: boolean; amount: string };
    clap: { enabled: boolean; amount: string };
    fire: { enabled: boolean; amount: string };
    laugh: { enabled: boolean; amount: string };
    like: { enabled: boolean; amount: string };
    token: Address;
    chainId: number;
  },
  userId: number,
) => {
  // Validate input using zod for security
  const schema = z.object({
    tippingEnabled: z.boolean(),
    heart: z.object({
      enabled: z.boolean(),
      amount: z.string().regex(/^\d+(\.\d{1,6})?$/),
    }),
    clap: z.object({
      enabled: z.boolean(),
      amount: z.string().regex(/^\d+(\.\d{1,6})?$/),
    }),
    fire: z.object({
      enabled: z.boolean(),
      amount: z.string().regex(/^\d+(\.\d{1,6})?$/),
    }),
    laugh: z.object({
      enabled: z.boolean(),
      amount: z.string().regex(/^\d+(\.\d{1,6})?$/),
    }),
    like: z.object({
      enabled: z.boolean(),
      amount: z.string().regex(/^\d+(\.\d{1,6})?$/),
    }),
    token: z.string(),
    chainId: z.number(),
  });
  const safe = schema.safeParse(formData);
  if (!safe.success) {
    throw new Error("Invalid tipping preferences payload");
  }

  // Upsert tipping preferences in the database
  const updated = await prisma.tippingPreferences.upsert({
    where: { userId },
    update: {
      heart: new Decimal(formData.heart.amount),
      clap: new Decimal(formData.clap.amount),
      fire: new Decimal(formData.fire.amount),
      laugh: new Decimal(formData.laugh.amount),
      like: new Decimal(formData.like.amount),
      enabledHeart: formData.heart.enabled,
      enabledClap: formData.clap.enabled,
      enabledFire: formData.fire.enabled,
      enabledLaugh: formData.laugh.enabled,
      enabledLike: formData.like.enabled,
      tippingEnabled: formData.tippingEnabled,
      token: formData.token,
      chainId: formData.chainId,
    },
    create: {
      userId,
      heart: new Decimal(formData.heart.amount),
      clap: new Decimal(formData.clap.amount),
      fire: new Decimal(formData.fire.amount),
      laugh: new Decimal(formData.laugh.amount),
      like: new Decimal(formData.like.amount),
      enabledHeart: formData.heart.enabled,
      enabledClap: formData.clap.enabled,
      enabledFire: formData.fire.enabled,
      enabledLaugh: formData.laugh.enabled,
      enabledLike: formData.like.enabled,
      tippingEnabled: formData.tippingEnabled,
      token: formData.token,
      chainId: formData.chainId,
    },
  });

  // Optionally revalidate settings page
  revalidatePath("/settings");

  return updated;
};
