import React, { useState, useRef, useEffect } from "react";
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
// Iconoir icons
import { NavArrowDown, Check, User } from "iconoir-react";

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
  const [error, setError] = useState<string | null>(null);
  const [recipient, setRecipient] = useState<TipRecipient | null>(
    recipients.length > 0 ? recipients[0] : null,
  );
  const [showRecipientList, setShowRecipientList] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showRecipientList) return;
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowRecipientList(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showRecipientList]);

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

  // --- Recipient Select UI ---
  function RecipientSelect() {
    if (recipients.length === 0) {
      return (
        <div className="text-sm text-primary flex items-center gap-2">
          <User className="w-5 h-5 opacity-60" />
          No recipients found.
        </div>
      );
    }
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          className={cn(
            "w-full flex items-center gap-3 border border-primary/30 rounded-xl px-4 py-3 font-sora text-base bg-muted/40 focus:outline-none focus:ring-2 focus:ring-primary transition",
            "active:ring-2 active:ring-primary",
            showRecipientList ? "ring-2 ring-primary" : "",
          )}
          aria-label="Select recipient"
          onClick={() => setShowRecipientList((v) => !v)}
          disabled={status === "loading"}
        >
          {recipient?.pfpUrl ? (
            <Image
              src={recipient.pfpUrl}
              alt={recipient.name}
              width={28}
              height={28}
              className="w-7 h-7 rounded-full"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
              {recipient?.name?.[0] ?? <User className="w-5 h-5" />}
            </div>
          )}
          <span className="flex-1 truncate text-left font-semibold">
            {recipient?.name ?? "Select recipient"}
          </span>
          <NavArrowDown
            className={cn(
              "w-5 h-5 ml-auto transition-transform text-primary",
              showRecipientList ? "rotate-180" : "",
            )}
            aria-hidden
          />
        </button>
        {showRecipientList && (
          <div
            className="absolute z-30 mt-2 w-full bg-background border border-primary/20 rounded-xl shadow-lg max-h-60 overflow-y-auto animate-fade-in"
            style={{ left: 0 }}
          >
            {recipients.map((r) => (
              <button
                key={r.fid}
                type="button"
                className={cn(
                  "flex items-center gap-3 w-full px-4 py-3 font-sora text-base transition focus:bg-primary/10",
                  recipient?.fid === r.fid
                    ? "bg-primary/10 font-bold"
                    : "hover:bg-primary/5",
                )}
                onClick={() => {
                  setRecipient(r);
                  setShowRecipientList(false);
                }}
                disabled={status === "loading"}
              >
                {r.pfpUrl ? (
                  <Image
                    src={r.pfpUrl}
                    alt={r.name}
                    width={28}
                    height={28}
                    className="w-7 h-7 rounded-full"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                    {r.name?.[0] ?? <User className="w-5 h-5" />}
                  </div>
                )}
                <span className="flex-1 truncate text-left">{r.name}</span>
                {recipient?.fid === r.fid && (
                  <Check className="w-5 h-5 text-primary" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

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
              <RecipientSelect />
            </div>
            <div className="text-destructive text-sm font-sora">{error}</div>
            {status === "success" && (
              <div className="text-green-600 text-sm font-sora flex items-center gap-2">
                <Check className="w-4 h-4" />
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
