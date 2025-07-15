import { NextRequest, NextResponse } from "next/server";
import { getPublicClient, getSpenderWalletClient } from "@/lib/spender";
import {
  spendPermissionManagerAbi,
  spendPermissionManagerAddress,
} from "@/lib/abi/SpendPermissionManager";
import { ERC20_ABI } from "@/lib/abi/ERC20";
import { prisma } from "@/lib/prisma";
import { USDC_ADDRESS } from "@/lib/constants";

import { parseUnits, Address } from "viem";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      spendPermission,
      signature,
      amount,
      decimals = 6,
      spaceId,
      fromId,
      toId,
    } = body;

    if (!amount || !spaceId || !fromId || !toId) {
      return NextResponse.json({ error: "missing fields" }, { status: 400 });
    }

    const MAX_TIP_AMOUNT = 100; // 100 USDC in units (decimals 6)

    if (Number(amount) > MAX_TIP_AMOUNT) {
      return NextResponse.json({ error: "amount too large" }, { status: 400 });
    }

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

    // spend the specified amount (units as string)
    const spendTx = await spender.writeContract({
      address: spendPermissionManagerAddress,
      abi: spendPermissionManagerAbi,
      functionName: "spend",
      args: [spendPermission, amount],
    });
    await publicClient.waitForTransactionReceipt({
      hash: spendTx,
    });

    // look up recipient address from DB
    const recipient = await prisma.user.findUnique({ where: { id: toId } });
    if (!recipient?.address) {
      return NextResponse.json(
        { error: "recipient address missing" },
        { status: 400 },
      );
    }

    // transfer USDC to recipient
    const transferTx = await spender.writeContract({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: "transfer",
      args: [recipient.address as Address, parseUnits(amount, decimals)],
    });

    await publicClient.waitForTransactionReceipt({ hash: transferTx });

    // record tip
    await prisma.tip.create({
      data: {
        spaceId,
        fromId,
        toId,
        amount,
        tokenSymbol: "USDC",
        txHash: transferTx,
      },
    });

    return NextResponse.json({ status: "success", spendTx, transferTx });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
