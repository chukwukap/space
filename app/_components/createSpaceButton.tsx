"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Mic } from "lucide-react";
import { toast } from "sonner";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useAccount } from "wagmi";
import { ShareAndroid, Copy } from "iconoir-react";
import { castInvite } from "@/lib/farcaster";
import { Room } from "livekit-server-sdk";

/**
 * CreateSpaceButton is hidden on space details (live room) pages.
 */
export default function CreateSpaceButton() {
  const pathname = usePathname();

  const { context } = useMiniKit();
  const { address, isConnected } = useAccount();

  const [title, setTitle] = useState("");
  const [record, setRecord] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  // Hide button if on a space details page (/space/[room])
  // This matches any route starting with /space/ and followed by something
  const isSpaceDetails = /^\/space\/[^/]+/.test(pathname);

  if (isSpaceDetails) {
    // Do not render the button in a live room
    return null;
  }

  async function handleCreateSpace() {
    if (!title.trim()) return;
    if (!address) {
      return;
    }
    if (!isConnected) {
      setCreateError("Please connect your wallet to host a Space.");
      toast.error("Please connect your wallet to host a Space.");
      return;
    }
    setCreating(true);
    setCreateError(null);

    const hostFid = context?.user?.fid;
    const hostAddress = address;

    try {
      const res = await fetch("/api/spaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          hostFid,
          hostAddress,
          recording: record,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create space");
      }

      const livekitRoom: Room = await res.json();
      const path = `/space/${livekitRoom.name}`;
      setShareUrl(`${window.location.origin}${path}`);
      setOpen(true);
      toast.success("Space created! Share your link.");
      setTitle("");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setCreateError(msg);
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <Drawer shouldScaleBackground={false} open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <button
            id="create-space-btn"
            className="fixed bottom-24 right-6 w-16 h-16 rounded-full flex items-center justify-center glass-card glow-hover border-primary/30 bg-primary/80 text-primary-foreground shadow-2xl backdrop-blur-md z-50"
            style={{ color: "white" }}
            aria-label="Create Space"
            type="button"
          >
            <Mic className="w-7 h-7 text-primary-foreground" />
          </button>
        </DrawerTrigger>

        <DrawerContent className="glass-card backdrop-blur-xl rounded-t-3xl border border-white/10 px-0 pb-10 text-foreground">
          {shareUrl == null ? (
            <div className="w-full px-8 pt-8 flex flex-col gap-6">
              <DrawerHeader className="text-center mb-4">
                <DrawerTitle>Create your Space</DrawerTitle>
              </DrawerHeader>

              <div className="flex flex-col gap-3">
                <label className="text-left text-sm font-medium">
                  Space title
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="px-4 py-2 rounded-lg bg-input text-foreground placeholder:text-muted-foreground"
                  placeholder="What are we talking about?"
                />
              </div>

              <div className="flex items-center justify-between">
                <span>Record Space</span>
                <input
                  type="checkbox"
                  checked={record}
                  onChange={(e) => setRecord(e.target.checked)}
                  className="w-5 h-5 accent-primary"
                />
              </div>

              {createError && (
                <div className="text-red-400 text-sm mb-2 text-center">
                  {createError}
                </div>
              )}

              <Button
                className="w-full"
                onClick={handleCreateSpace}
                disabled={!title.trim() || creating}
                aria-busy={creating}
              >
                {creating ? "Starting..." : "Start your Space"}
              </Button>
            </div>
          ) : (
            <div className="w-full px-8 pt-8 flex flex-col gap-6 items-center">
              <DrawerHeader className="text-center mb-2">
                <DrawerTitle>You&apos;re live! Spread the word</DrawerTitle>
              </DrawerHeader>

              <div className="grid grid-cols-2 gap-4 w-full">
                <Button
                  variant="secondary"
                  className="flex-col gap-1"
                  onClick={async () => {
                    await navigator.clipboard.writeText(shareUrl);
                    toast.success("Link copied");
                  }}
                >
                  <Copy /> Copy link
                </Button>
                <Button
                  variant="secondary"
                  className="flex-col gap-1"
                  onClick={async () => {
                    if (!context?.client) return;
                    await castInvite(context.client as unknown, {
                      url: shareUrl,
                    });
                    setOpen(false);
                  }}
                >
                  <ShareAndroid /> Cast it
                </Button>
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </>
  );
}
