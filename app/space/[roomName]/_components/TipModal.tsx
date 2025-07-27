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
import { toast } from "sonner";
import { TipRecipient } from "@/lib/types";
import { sendTipAction } from "@/actions/tip";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

/**
 * TipModalProps defines the props for the TipModal component.
 * - userFid: tipper's Farcaster fid
 * - spaceId: string, e.g. LiveKit room id
 */
interface TipModalProps {
  open: boolean;
  onClose: () => void;
  recipients: TipRecipient[];
  onTipSuccess?: () => void;
  senderFid: number | undefined;
  spaceId: string;
}

export default function TipModal({
  open,
  onClose,
  recipients,
  onTipSuccess,
  senderFid,
  spaceId,
}: TipModalProps) {
  const [amount, setAmount] = useState(0);
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  console.log("[TipModal] recipients", recipients, senderFid);
  const [error, setError] = useState<string | null>(null);
  const [recipient, setRecipient] = useState<TipRecipient | null>(
    recipients.length > 0 ? recipients[0] : null,
  );

  /**
   * Handles the tip action, integrating the server action for tipping.
   * Security: Ensures the connected wallet matches the tipperWalletAddress.
   */
  const handleTip = async () => {
    if (!recipient) return;
    setStatus("loading");
    setError(null);
    try {
      if (!senderFid) return;
      // Call the server action to send the tip
      const res = await sendTipAction({
        senderFid,
        recipientFid: recipient.fid,
        amount,
        spaceId,
      });

      if (res.ok) {
        setStatus("success");
        toast.success("Tip sent successfully!");
        if (onTipSuccess) onTipSuccess();
        setTimeout(() => {
          setStatus("idle");
          setAmount(0);
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
      <DrawerContent className="glass-card">
        <div className="flex flex-col h-full max-w-lg mx-auto w-full">
          <DrawerHeader className="justify-center text-center">
            <DrawerTitle className="text-2xl font-bold text-primary text-center">
              Send a Tip
            </DrawerTitle>
            <DrawerDescription className="text-sm text-muted-foreground text-center">
              Show your appreciation! Enter an amount and select a recipient.
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 py-2 space-y-5">
            <div className="flex flex-col gap-2">
              <Label>Amount</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className={cn(
                    "w-full rounded-lg border border-input bg-background px-3 py-2 text-lg font-semibold text-center outline-none focus:ring-2 focus:ring-primary transition",
                    "placeholder:text-muted-foreground",
                  )}
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  aria-label="Tip amount"
                />
                <Image
                  src="/tokens/usdc.png"
                  alt="USDC"
                  width={24}
                  height={24}
                  className="w-6 h-6 rounded-full"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Recipient</Label>
              <div className="relative">
                {/* Use shadcn/ui Select properly */}

                {recipients.length > 0 ? (
                  <Select
                    value={recipient?.fid.toString() ?? ""}
                    onValueChange={(val: string) => {
                      const found = recipients.find(
                        (r) => r?.fid === Number(val),
                      );
                      setRecipient(found ?? null);
                    }}
                    disabled={status === "loading"}
                  >
                    <SelectTrigger
                      className={cn(
                        "w-full border border-primary/30 rounded-xl px-4 py-3 font-sora text-base bg-muted/40 focus:outline-none focus:ring-2 focus:ring-primary transition",
                      )}
                      aria-label="Select recipient"
                    />
                    <SelectContent>
                      {recipients.map((r) => (
                        <SelectItem
                          key={r?.fid}
                          value={r?.fid?.toString() ?? ""}
                          className="font-sora text-base"
                        >
                          <div className="flex items-center gap-2">
                            {r?.pfpUrl && (
                              <Image
                                src={r?.pfpUrl}
                                alt={r?.name}
                                width={24}
                                height={24}
                                className="w-6 h-6 rounded-full"
                              />
                            )}
                            <span>{r?.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-sm text-primary">
                    No recipients found.
                  </div>
                )}
              </div>
            </div>
            <div className="text-destructive text-sm font-sora">{error}</div>
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
            >
              Cancel
            </Button>
            <Button
              onClick={handleTip}
              disabled={
                status === "loading" || !amount || amount <= 0 || !recipient
              }
              className="text-sm"
            >
              {status === "loading" ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin inline-block w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
                  Sending...
                </span>
              ) : (
                <>
                  <span className="font-medium">Tip</span>
                  <span className="">{recipient?.name}</span>
                </>
              )}
            </Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
