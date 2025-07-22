"use client";
import { useState } from "react";
import { Address, Hex, parseUnits } from "viem";
import { USDC_ADDRESS_BASE } from "@/lib/constants";
import {
  useAccount,
  useChainId,
  useConnect,
  useConnectors,
  useSignTypedData,
} from "wagmi";
import { spendPermissionManagerAddress } from "@/lib/abi/SpendPermissionManager";
import { useMutation } from "@tanstack/react-query";

interface SpendPermissionStruct {
  account: Address;
  spender: Address;
  token: Address;
  allowance: bigint;
  period: number;
  start: number;
  end: number;
  salt: bigint;
  extraData: Hex;
}

export default function SubscribeButton() {
  const [isDisabled, setDisabled] = useState(false);
  const [permission, setPermission] = useState<SpendPermissionStruct>();
  const [signature, setSignature] = useState<Hex>();

  const account = useAccount();
  const chainId = useChainId();
  const { connectAsync } = useConnect();
  const connectors = useConnectors();
  const { signTypedDataAsync } = useSignTypedData();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const collectMutation = useMutation({
    mutationFn: async () => {
      if (!permission || !signature) throw new Error("missing data");
      const replacer = (k: string, v: unknown) =>
        typeof v === "bigint" ? v.toString() : v;
      const res = await fetch("/api/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          { spendPermission: permission, signature },
          replacer,
        ),
      });
      if (!res.ok) throw new Error("collect failed");
      return res.json();
    },
  });

  async function handleSubscribe() {
    setDisabled(true);
    let addr = account.address as Address | undefined;
    if (!addr) {
      const res = await connectAsync({ connector: connectors[0] });
      addr = res.accounts[0] as Address;
    }

    const spendPerm: SpendPermissionStruct = {
      account: addr!,
      spender: process.env.NEXT_PUBLIC_SPENDER_ADDRESS as Address,
      token: USDC_ADDRESS_BASE,
      allowance: parseUnits("10", 6),
      period: 86400,
      start: 0,
      end: 281474976710655,
      salt: BigInt(0),
      extraData: "0x" as Hex,
    };
    setPermission(spendPerm);

    const sig = await signTypedDataAsync({
      domain: {
        name: "Spend Permission Manager",
        version: "1",
        chainId,
        verifyingContract: spendPermissionManagerAddress,
      },
      types: {
        SpendPermission: [
          { name: "account", type: "address" },
          { name: "spender", type: "address" },
          { name: "token", type: "address" },
          { name: "allowance", type: "uint160" },
          { name: "period", type: "uint48" },
          { name: "start", type: "uint48" },
          { name: "end", type: "uint48" },
          { name: "salt", type: "uint256" },
          { name: "extraData", type: "bytes" },
        ],
      },
      primaryType: "SpendPermission",
      message: spendPerm,
    });
    setSignature(sig as Hex);
    setDisabled(false);
  }

  return (
    <button
      className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      disabled={isDisabled}
      onClick={handleSubscribe}
    >
      {isDisabled ? "Processing…" : "Subscribe"}
    </button>
  );
}
