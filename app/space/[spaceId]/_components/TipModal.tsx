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
import { useAccount, useConnect, useConnectors } from "wagmi";
import { toast } from "sonner";
import { TipRecipient } from "@/lib/types";
import { sendTipAction } from "@/actions/tip";

/**
 * TipModalProps defines the props for the TipModal component.
 * - userFid: tipper's Farcaster fid
 * - spaceId: string, e.g. LiveKit room id
 * - tokenAddress: string, ERC-20 token address (USDC)
 * - tipperWalletAddress: tipper's wallet address
 */
interface TipModalProps {
  open: boolean;
  onClose: () => void;
  recipients: TipRecipient[];
  defaultRecipientId: number;
  onTipSuccess?: () => void;
  userFid: number;
  spaceId: string;
  tokenAddress: string;
  tipperWalletAddress: string;
}

export default function TipModal({
  open,
  onClose,
  recipients,
  defaultRecipientId,
  onTipSuccess,
  userFid,
  spaceId,
  tokenAddress,
  tipperWalletAddress,
}: TipModalProps) {
  const [amount, setAmount] = useState("");
  const [recipientId, setRecipientId] = useState(defaultRecipientId);
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  const account = useAccount();
  const { connectAsync } = useConnect();
  const connectors = useConnectors();

  const recipient = recipients.find((r) => r.fid === recipientId);

  /**
   * Handles the tip action, integrating the server action for tipping.
   * Security: Ensures the connected wallet matches the tipperWalletAddress.
   */
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

      if (addr.toLowerCase() !== tipperWalletAddress.toLowerCase()) {
        throw new Error("Connected wallet does not match your profile wallet.");
      }

      // Call the server action to send the tip
      const res = await sendTipAction({
        fromFid: userFid,
        toFid: recipient.fid,
        amount,
        spaceId,
        tokenAddress,
        tipperAddress: tipperWalletAddress,
        tippeeAddress: recipient.walletAddress,
      });

      if (res.ok) {
        setStatus("success");
        toast.success("Tip sent successfully!");
        if (onTipSuccess) onTipSuccess();
        setTimeout(() => {
          setStatus("idle");
          setAmount("");
          onClose();
        }, 1500);
      } else {
        setStatus("error");
        setError(res.error || "Failed to send tip.");
        toast.error(res.error || "Failed to send tip.");
      }
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
          <DrawerTitle>
            <span className="font-sora text-xl flex items-center gap-2">
              <span className="inline-block w-7 h-7 rounded-full aurora-bg shadow-md mr-1" />
              Send a Tip
            </span>
          </DrawerTitle>
          <DrawerDescription>
            <span className="font-sora text-base text-muted-foreground">
              Show your appreciation! Enter an amount and select a recipient.
            </span>
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 py-2 space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-1 font-sora">
              Amount <span className="text-primary font-bold">(USDC)</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="0.01"
                step="0.01"
                inputMode="decimal"
                className="w-full border border-primary/30 rounded-xl px-4 py-3 font-sora text-lg bg-muted/40 focus:outline-none focus:ring-2 focus:ring-primary transition"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={status === "loading"}
                placeholder="0.00"
                autoFocus
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-primary font-bold pointer-events-none font-sora">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 22 22"
                  className="inline-block mr-1"
                  fill="none"
                >
                  <circle cx="11" cy="11" r="11" fill="#5B8CFF" />
                  <text
                    x="11"
                    y="15"
                    textAnchor="middle"
                    fontSize="10"
                    fill="#fff"
                    fontFamily="Sora, sans-serif"
                  >
                    $
                  </text>
                </svg>
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1 font-sora">
              Recipient
            </label>
            <div className="relative">
              <select
                className="w-full border border-primary/30 rounded-xl px-4 py-3 font-sora text-base bg-muted/40 focus:outline-none focus:ring-2 focus:ring-primary transition"
                value={recipientId}
                onChange={(e) => setRecipientId(Number(e.target.value))}
                disabled={status === "loading"}
              >
                {recipients.map((r) => (
                  <option key={r.fid} value={r.fid}>
                    {r.name}
                  </option>
                ))}
              </select>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-primary pointer-events-none">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path
                    d="M5 7l4 4 4-4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </div>
          </div>
          {status === "error" && (
            <div className="text-destructive text-sm font-sora">{error}</div>
          )}
          {status === "success" && (
            <div className="text-green-600 text-sm font-sora">
              Tip sent successfully!
            </div>
          )}
        </div>
        <DrawerFooter>
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={status === "loading"}
            className="font-sora"
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
            className="font-sora bg-gradient-to-r from-primary to-secondary text-white rounded-xl shadow-lg px-6 py-3 text-lg"
          >
            {status === "loading" ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin inline-block w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
                Sending...
              </span>
            ) : (
              <>
                <span className="font-bold">Tip</span>
                <span className="ml-1">{amount || ""}</span>
                <span className="ml-1 text-primary">USDC</span>
              </>
            )}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
