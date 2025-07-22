"use server";

import { getPublicClient, getSpenderWalletClient } from "@/lib/wallet";
import {
  SpendPermission,
  SpendPermissionBatch,
  SpendPermissionWithSignature,
  SupportedToken,
} from "@/lib/types";
import {
  spendPermissionManagerAbi,
  spendPermissionManagerAddress,
} from "@/lib/abi/SpendPermissionManager";
import prisma from "@/lib/prisma";

/**
 * Store a new spend permission onchain and in the database.
 */
export async function storeSpendPermission(
  spendPermissionMessage: SpendPermission | SpendPermissionBatch,
  signature: string,
  userFid: number,
  isBatch: boolean = false,
) {
  const spender = await getSpenderWalletClient();
  const publicClient = await getPublicClient();

  // Write the spend permission to the contract
  const approveTx = await spender.writeContract({
    address: spendPermissionManagerAddress,
    abi: spendPermissionManagerAbi,
    functionName: isBatch
      ? "approveBatchWithSignature"
      : "approveWithSignature",
    args: [spendPermissionMessage, signature],
  });

  // Wait for transaction confirmation
  const txHash = await publicClient.waitForTransactionReceipt({
    hash: approveTx,
  });

  if (!txHash) {
    throw new Error("Failed to approve spend permission");
  }

  // Store spend permission in the database
  await prisma.user.update({
    where: { fid: userFid },
    data: {
      spendPerm: JSON.stringify({
        spendPermissionMessage,
        signature,
        txHash: txHash.transactionHash,
      }),
    },
  });

  return txHash.transactionHash;
}

/**
 * Fetch spend permissions for a user from the database and check onchain status.
 * Returns an array of spend permissions with their onchain approval status.
 */
export async function fetchSpendPermissions(
  userFid: number,
  tokens?: SupportedToken[],
) {
  // Fetch spend permissions from the database
  const user = await prisma.user.findUnique({
    where: { fid: userFid },
    select: { spendPerm: true },
  });

  if (!user || !user.spendPerm) {
    return [];
  }

  let spendPerms: SpendPermissionWithSignature[] = [];

  try {
    // Handle both single and array storage
    const parsed = JSON.parse(user.spendPerm as string);
    if (Array.isArray(parsed)) {
      spendPerms = parsed;
    } else {
      spendPerms = [parsed];
    }
  } catch (err) {
    console.error(err);
    // Malformed data
    return [];
  }

  const publicClient = await getPublicClient();

  // Check onchain approval status for each spend permission
  const results = await Promise.all(
    spendPerms
      .filter((perm) =>
        tokens
          ? tokens
              .map((t) => t.address)
              .includes(perm.spendPermissionMessage.token)
          : true,
      )
      .map(async (perm) => {
        let isApproved: boolean = false;
        try {
          const result = await publicClient.readContract({
            address: spendPermissionManagerAddress,
            abi: spendPermissionManagerAbi,
            functionName: "isApproved",
            args: [perm.spendPermissionMessage],
          });
          isApproved = Boolean(result);
        } catch {
          // If the contract call fails, treat as not approved
          isApproved = false;
        }
        return {
          ...perm,
          isApproved,
        };
      }),
  );

  return results;
}
