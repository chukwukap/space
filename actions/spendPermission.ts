"use server";

import { getPublicClient, getSpenderWalletClient } from "@/lib/utils";
import { SpendPermission } from "@/lib/types";
import {
  spendPermissionManagerAbi,
  spendPermissionManagerAddress,
} from "@/lib/abi/SpendPermissionManager";
import { Address } from "viem";
import prisma from "@/lib/prisma";

export async function approveSpendPermission(
  spendPermissionMessage: SpendPermission,
  signature: string,
  from: Address,
) {
  const spender = await getSpenderWalletClient();
  const publicClient = await getPublicClient();

  const approveTx = await spender.writeContract({
    address: spendPermissionManagerAddress,
    abi: spendPermissionManagerAbi,
    functionName: "approveWithSignature",
    args: [spendPermissionMessage, signature],
  });

  const txHash = await publicClient.waitForTransactionReceipt({
    hash: approveTx,
  });

  if (!txHash) {
    throw new Error("Failed to approve spend permission");
  }

  await prisma.user.update({
    where: { address: from },
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
