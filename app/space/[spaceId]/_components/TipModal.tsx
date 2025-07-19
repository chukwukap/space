import React, { useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import {
  useAccount,
  useChainId,
  useConnect,
  useConnectors,
  useSignTypedData,
} from "wagmi";
import { getSpendPermTypedData } from "@/lib/utils";
import { approveSpendPermission } from "@/actions/spendPermission";
import { spend } from "@/actions/utils";
import { toast } from "sonner";
import { Address } from "viem";

interface TipModalProps {
  open: boolean;
  onClose: () => void;
  recipients: Array<{ id: string; name: string; walletAddress: string }>;
  defaultRecipientId: string;
  onTipSuccess?: () => void;
  userId: string;
  spaceId: string;
}

export default function TipModal({
  open,
  onClose,
  recipients,
  defaultRecipientId,
  onTipSuccess,
  userId,
  spaceId,
}: TipModalProps) {
  const [amount, setAmount] = useState("");
  const [recipientId, setRecipientId] = useState(defaultRecipientId);
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  const account = useAccount();
  const chainId = useChainId();
  const { connectAsync } = useConnect();
  const connectors = useConnectors();
  const { signTypedDataAsync } = useSignTypedData();

  const recipient = recipients.find((r) => r.id === recipientId);

  const handleTip = async () => {
    setStatus("loading");
    setError(null);
    try {
      if (!recipient || !recipient.walletAddress) {
        throw new Error("Recipient wallet address not found");
      }
      let addr = account.address;
      if (!addr) {
        const res = await connectAsync({ connector: connectors[0] });
        addr = res.accounts[0];
      }
      if (!addr) throw new Error("Wallet not connected");
      const spendPerm = getSpendPermTypedData(addr, chainId);
      const signature = await signTypedDataAsync(spendPerm);
      // Approve spend permission
      await approveSpendPermission(
        spendPerm.message,
        signature,
        parseInt(userId),
      );
      // Send tip on-chain
      const amountBigInt = BigInt(Math.floor(parseFloat(amount) * 1e6)); // USDC 6 decimals
      const spendTxHash = await spend(
        addr,
        recipient.walletAddress as Address,
        amountBigInt,
        spendPerm.message,
      );
      // Record tip in DB
      const res = await fetch("/api/tips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spaceId,
          fromFid: userId,
          toFid: recipientId,
          amount,
          tokenSymbol: "USDC",
          txHash: spendTxHash,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to record tip");
      }
      setStatus("success");
      if (onTipSuccess) onTipSuccess();
      setTimeout(() => {
        setStatus("idle");
        setAmount("");
        onClose();
      }, 1500); // 1.5 seconds
    } catch (err: unknown) {
      setStatus("error");
      if (err instanceof Error) {
        setError(err.message);
        toast.error(err.message);
      } else {
        setError("Unknown error");
        toast.error("Unknown error");
      }
    }
  };

  return (
    <Drawer open={open} onOpenChange={onClose}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Send a Tip</DrawerTitle>
          <DrawerDescription>
            Show your appreciation! Enter an amount and select a recipient.
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 py-2 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Amount (USDC)
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              className="w-full border rounded px-3 py-2"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={status === "loading"}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Recipient</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={recipientId}
              onChange={(e) => setRecipientId(e.target.value)}
              disabled={status === "loading"}
            >
              {recipients.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          {status === "error" && (
            <div className="text-red-600 text-sm">{error}</div>
          )}
          {status === "success" && (
            <div className="text-green-600 text-sm">Tip sent successfully!</div>
          )}
        </div>
        <DrawerFooter>
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={status === "loading"}
          >
            Cancel
          </Button>
          <Button
            onClick={handleTip}
            disabled={
              status === "loading" ||
              !amount ||
              parseFloat(amount) <= 0 ||
              !recipientId
            }
          >
            {status === "loading" ? "Sending..." : `Tip ${amount || ""} USDC`}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
