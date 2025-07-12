import { NextRequest, NextResponse } from "next/server";
import { getPublicClient, getSpenderWalletClient } from "@/lib/spender";
import {
  spendPermissionManagerAbi,
  spendPermissionManagerAddress,
} from "@/lib/abi/SpendPermissionManager";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { spendPermission, signature } = body;

    const spender = await getSpenderWalletClient();
    const publicClient = await getPublicClient();

    // approve
    const approveTx = await spender.writeContract({
      address: spendPermissionManagerAddress,
      abi: spendPermissionManagerAbi,
      functionName: "approveWithSignature",
      args: [spendPermission, signature],
    });

    await publicClient.waitForTransactionReceipt({ hash: approveTx });

    // spend 1 unit (example)
    const spendTx = await spender.writeContract({
      address: spendPermissionManagerAddress,
      abi: spendPermissionManagerAbi,
      functionName: "spend",
      args: [spendPermission, "1"],
    });
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: spendTx,
    });

    return NextResponse.json({
      status: receipt.status ? "success" : "failure",
      hash: spendTx,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
