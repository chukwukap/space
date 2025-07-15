"use client";

import { useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Copy, Share2, MessageCircle, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { castInvite } from "@/lib/farcaster";

interface ShareSheetProps {
  open: boolean;
  onClose: () => void;
  spaceUrl: string;
}

export default function ShareSheet({
  open,
  onClose,
  spaceUrl,
}: ShareSheetProps) {
  const { context } = useMiniKit();
  const [qr, setQr] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(spaceUrl);
    } catch {}
  };

  const handleCast = async () => {
    if (!context?.client) return;
    await castInvite(context.client as unknown, { url: spaceUrl });
    onClose();
  };

  return (
    <Drawer open={open} onOpenChange={onClose} shouldScaleBackground={false}>
      <DrawerContent className="glass-card p-6 flex flex-col items-center gap-6 w-80 mx-auto rounded-2xl">
        <DrawerHeader>
          <DrawerTitle>You&apos;re live! Spread the word</DrawerTitle>
        </DrawerHeader>
        {!qr ? (
          <div className="grid grid-cols-2 gap-4 w-full">
            <Button
              variant="secondary"
              className="flex-col gap-1"
              onClick={handleCopy}
            >
              <Copy /> Copy link
            </Button>
            <Button
              variant="secondary"
              className="flex-col gap-1"
              onClick={handleCast}
            >
              <Share2 /> Cast it
            </Button>
            <Button
              variant="secondary"
              className="flex-col gap-1"
              onClick={() => setQr(true)}
            >
              <QrCode /> QR
            </Button>
            <Button
              variant="outline"
              className="flex-col gap-1"
              onClick={onClose}
            >
              <MessageCircle /> Maybe later
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <QRCodeSVG
              value={spaceUrl}
              size={160}
              bgColor="transparent"
              fgColor="#000"
            />
            <Button onClick={() => setQr(false)}>Back</Button>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
