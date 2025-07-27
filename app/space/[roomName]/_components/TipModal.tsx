import React, { useState, useEffect, useRef } from "react";
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
import { NavArrowDown, Check, User, Xmark } from "iconoir-react";

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
        }, 1200);
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
        <div className="text-sm text-primary flex items-center gap-2 py-2">
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
            "w-full flex items-center gap-3 border border-primary/30 rounded-lg px-3 py-2 font-sora text-base bg-muted/40 focus:outline-none focus:ring-2 focus:ring-primary transition",
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
            className="absolute z-30 mt-2 w-full bg-background border border-primary/20 rounded-lg shadow-lg max-h-56 overflow-y-auto animate-fade-in"
            style={{ left: 0 }}
          >
            {recipients.map((r) => (
              <button
                key={r.fid}
                type="button"
                className={cn(
                  "flex items-center gap-3 w-full px-3 py-2 font-sora text-base transition focus:bg-primary/10",
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
      <DrawerContent className="glass-card px-0 py-0">
        <div className="flex flex-col h-full max-w-[420px] mx-auto w-full px-2 py-3">
          <DrawerHeader className="justify-center text-center px-0 py-2">
            <DrawerTitle className="text-lg font-bold text-primary text-center font-sora">
              Send a Tip
            </DrawerTitle>
            <DrawerDescription className="text-xs text-muted-foreground text-center font-sora">
              Show your appreciation to a speaker.
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1">
              <Label className="mb-1 font-sora text-sm">Amount</Label>
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
                  disabled={status === "loading"}
                  style={{ fontFamily: "Sora, sans-serif" }}
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
            <div className="flex flex-col gap-1">
              <Label className="mb-1 font-sora text-sm">Recipient</Label>
              <RecipientSelect />
            </div>
            {error && (
              <div className="text-destructive text-xs font-sora flex items-center gap-2">
                <Xmark className="w-4 h-4" />
                {error}
              </div>
            )}
            {status === "success" && (
              <div className="text-green-600 text-xs font-sora flex items-center gap-2">
                <Check className="w-4 h-4" />
                Tip sent!
              </div>
            )}
          </div>
          <DrawerFooter className="flex flex-row gap-2 mt-2 px-0">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={status === "loading"}
              className="flex-1 text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleTip}
              disabled={
                status === "loading" || !amount || amount <= 0 || !recipient
              }
              className="flex-1 text-sm font-bold min-w-0 px-2"
              style={{
                maxWidth: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.25rem",
              }}
            >
              {status === "loading" ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin inline-block w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
                  Sending...
                </span>
              ) : (
                <>
                  <span>Tip</span>
                  {recipient?.name && (
                    <span
                      className="truncate max-w-[7.5rem] text-ellipsis"
                      style={{
                        display: "inline-block",
                        verticalAlign: "bottom",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        maxWidth: "7.5rem",
                      }}
                    >
                      {recipient.name}
                    </span>
                  )}
                </>
              )}
            </Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
