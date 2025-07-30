"use server";

import { z } from "zod";
import { getPublicClient, getSpenderWalletClient } from "@/lib/wallet";
import { Address, erc20Abi, parseUnits } from "viem";
import prisma from "@/lib/prisma";

/**
 * Zod schema for input validation.
 * senderAddress and recipientAddress are required, as we no longer use Farcaster FIDs.
 */
const tipSchema = z.object({
  senderAddress: z.string().min(1, "Sender address required"),
  recipientAddress: z.string().min(1, "Recipient address required"),
  amount: z.number().refine((val) => val > 0, "Amount must be positive"),
  spaceId: z.string().min(1, "Space ID required"),
});

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
  const { senderAddress, recipientAddress, amount, spaceId } = parsed.data;

  // Security: Check for self-tipping
  if (senderAddress.toLowerCase() === recipientAddress.toLowerCase()) {
    return { ok: false, error: "You cannot tip yourself." };
  }

  // Fetch users by address from the database, including their tipping preferences
  const [fromUser, toUser] = await Promise.all([
    prisma.user.findUnique({
      where: { address: senderAddress.toLowerCase() },
      include: { tippingPreferences: true },
    }),
    prisma.user.findUnique({
      where: { address: recipientAddress.toLowerCase() },
      include: { tippingPreferences: true },
    }),
  ]);

  if (!fromUser || !toUser) {
    return { ok: false, error: "User not found." };
  }

  // Security: Check for minimum tip amount (e.g. 0.01)
  if (Number(amount) < 0.01) {
    return { ok: false, error: "Minimum tip is 0.01." };
  }

  // Security: Check for valid addresses and tipping preferences
  if (
    !fromUser.address ||
    !toUser.address ||
    !fromUser.tippingPreferences ||
    !fromUser.tippingPreferences.token ||
    !fromUser.tippingPreferences.chainId
  ) {
    return {
      ok: false,
      error: "Sender or recipient is missing wallet or tipping preferences.",
    };
  }

  // Use the sender's tipping preferences for token and chain
  const tokenAddress = fromUser.tippingPreferences.token;

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
        abi: erc20Abi,
        functionName: "decimals",
      })) as number;
    } catch {
      decimals = 6;
    }
    try {
      tokenSymbol = (await publicClient.readContract({
        address: tokenAddress as Address,
        abi: erc20Abi,
        functionName: "symbol",
      })) as string;
    } catch {
      tokenSymbol = "TOKEN";
    }
    // parseUnits expects string, so convert amount to string
    const amountInUnits = parseUnits(amount.toString(), decimals);

    // 1. Transfer ERC-20 from tipper to spenderAddress
    //    (tipper has already approved spenderAddress to spend)
    //    We use transferFrom(tipper, spender, amount)
    const tx1 = await spenderWallet.writeContract({
      address: tokenAddress as Address,
      abi: erc20Abi,
      functionName: "transferFrom",
      args: [
        fromUser.address as Address,
        spenderWallet.account.address as Address,
        amountInUnits,
      ],
    });
    await publicClient.waitForTransactionReceipt({ hash: tx1 });

    // 2. Transfer from spenderAddress to tippee
    const tx2 = await spenderWallet.writeContract({
      address: tokenAddress as Address,
      abi: erc20Abi,
      functionName: "transfer",
      args: [toUser.address as Address, amountInUnits],
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
    // Create the tip record
    const tip = await prisma.tip.create({
      data: {
        spaceId,
        fromAddress: fromUser.address,
        toAddress: toUser.address,
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
