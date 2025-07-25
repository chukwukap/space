"use server";

import { z } from "zod";
import { ERC20Abi } from "@/lib/abi/ERC20";
import { getAddress } from "viem/utils";
import { getPublicClient, getSpenderWalletClient } from "@/lib/wallet";
import { Address, parseUnits } from "viem";
import prisma from "@/lib/prisma";

// --- Zod schema for input validation ---
const tipSchema = z.object({
  fromFid: z.number().int().positive(),
  toFid: z.number().int().positive(),
  amount: z
    .string()
    .refine((val) => Number(val) > 0, "Amount must be positive"),
  spaceId: z.string().min(1),
  tokenAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/), // ERC-20 token address
  tipperAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  tippeeAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
});

// --- Main server action ---
/**
 * Handles the full ERC-20 tip flow:
 * 1. Transfers tokens from tipper to SPENDER_ADDRESS (using transferFrom, tipper must have approved SPENDER_ADDRESS)
 * 2. Transfers tokens from SPENDER_ADDRESS to tippee (using transfer)
 * 3. Persists the tip to the database
 */
export async function sendTipAction(input: z.infer<typeof tipSchema>) {
  // Validate input
  const parsed = tipSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.message };
  }
  const {
    fromFid,
    toFid,
    amount,
    spaceId,
    tokenAddress,
    tipperAddress,
    tippeeAddress,
  } = parsed.data;

  // Security: Check for self-tipping
  if (fromFid === toFid) {
    return { ok: false, error: "You cannot tip yourself." };
  }

  // Security: Check for valid addresses
  let spenderAddress: string;
  try {
    getAddress(tipperAddress);
    getAddress(tippeeAddress);
    getAddress(tokenAddress);
    // Get spender address from wallet util
    const spenderWallet = await getSpenderWalletClient();
    spenderAddress = spenderWallet.account.address as string;
    getAddress(spenderAddress);
  } catch {
    return { ok: false, error: "Invalid address provided." };
  }

  // Security: Check for minimum tip amount (e.g. 0.01)
  if (Number(amount) < 0.01) {
    return { ok: false, error: "Minimum tip is 0.01." };
  }

  // --- Blockchain interaction ---
  const publicClient = await getPublicClient();
  const spenderWallet = await getSpenderWalletClient();

  let txHash2: string | undefined;
  let tokenSymbol: string = "UNKNOWN";

  try {
    // Get decimals and symbol
    let decimals = 6;
    try {
      decimals = (await publicClient.readContract({
        address: tokenAddress as Address,
        abi: ERC20Abi,
        functionName: "decimals",
      })) as number;
    } catch {
      decimals = 6;
    }
    try {
      tokenSymbol = (await publicClient.readContract({
        address: tokenAddress as Address,
        abi: ERC20Abi,
        functionName: "symbol",
      })) as string;
    } catch {
      tokenSymbol = "TOKEN";
    }
    const amountInUnits = parseUnits(amount, decimals);

    // 1. Transfer ERC-20 from tipper to spenderAddress
    //    (tipper has already approved spenderAddress to spend)
    //    We use transferFrom(tipper, spender, amount)
    const tx1 = await spenderWallet.writeContract({
      address: tokenAddress as Address,
      abi: ERC20Abi,
      functionName: "transferFrom",
      args: [
        tipperAddress as Address,
        spenderAddress as Address,
        amountInUnits,
      ],
    });
    await publicClient.waitForTransactionReceipt({ hash: tx1 });

    // 2. Transfer from spenderAddress to tippee
    const tx2 = await spenderWallet.writeContract({
      address: tokenAddress as Address,
      abi: ERC20Abi,
      functionName: "transfer",
      args: [tippeeAddress as Address, amountInUnits],
    });
    await publicClient.waitForTransactionReceipt({ hash: tx2 });
    txHash2 = tx2;
  } catch (err) {
    return {
      ok: false,
      error:
        "Blockchain error: " +
        (err instanceof Error ? err.message : "Unknown error"),
    };
  }

  // --- Persist to DB ---
  try {
    // Find or create the tipper and tippee users by fid
    const [fromUser, toUser] = await Promise.all([
      prisma.user.findUnique({ where: { fid: fromFid } }),
      prisma.user.findUnique({ where: { fid: toFid } }),
    ]);
    if (!fromUser || !toUser) {
      return { ok: false, error: "User not found." };
    }

    // Create the tip record
    const tip = await prisma.tip.create({
      data: {
        spaceId,
        fromFid,
        toFid,
        amount: amount,
        tokenSymbol,
        txHash: txHash2!, // The final transfer to tippee
      },
    });

    return { ok: true, tip, txHash: txHash2 };
  } catch (err) {
    return {
      ok: false,
      error:
        "Database error: " +
        (err instanceof Error ? err.message : "Unknown error"),
    };
  }
}
