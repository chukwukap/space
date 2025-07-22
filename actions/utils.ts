import {
  spendPermissionManagerAbi,
  spendPermissionManagerAddress,
} from "@/lib/abi/SpendPermissionManager";
import { SpendPermission } from "@/lib/types";
import { getPublicClient, getSpenderWalletClient } from "@/lib/wallet";
import { Address } from "viem";

export async function spend(
  from: Address,
  to: Address,
  amount: bigint,
  spendPermissionData: SpendPermission,
) {
  const spender = await getSpenderWalletClient();
  const publicClient = await getPublicClient();

  const spendTx = await spender.writeContract({
    address: spendPermissionManagerAddress,
    abi: spendPermissionManagerAbi,
    functionName: "spend",
    args: [spendPermissionData, amount],
  });

  const txHash = await publicClient.waitForTransactionReceipt({
    hash: spendTx,
  });

  if (!txHash) {
    throw new Error("Failed to spend");
  }
}
