"use client";

import { useState, useCallback } from "react";
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
import { useAccount, useConnect } from "wagmi";
import ShareSheet from "./shareSheet";

export default function CreateSpaceButton() {
  const { context } = useMiniKit();
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();

  const [title, setTitle] = useState("");
  const [record, setRecord] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  const promptWalletConnect = useCallback(() => {
    if (connectors && connectors.length > 0) {
      connect({ connector: connectors[0] });
      toast.info("Please connect your wallet to host a Space.");
    } else {
      toast.error(
        "No wallet connector found. Please install a wallet extension.",
      );
    }
  }, [connect, connectors]);

  async function handleCreateSpace() {
    if (!title.trim()) return;
    if (!address) {
      promptWalletConnect();
      return;
    }
    if (!isConnected) {
      setCreateError("Please connect your wallet to host a Space.");
      toast.error("Please connect your wallet to host a Space.");
      return;
    }
    setCreating(true);
    setCreateError(null);

    const hostId =
      context?.user?.fid != null ? String(context.user.fid) : address;

    try {
      const res = await fetch("/api/spaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          hostId,
          recording: record,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create space");
      }
      const livekitRoom = await res.json();
      const path = `/space/${livekitRoom.name}?title=${encodeURIComponent(title)}`;
      setShareUrl(`${window.location.origin}${path}`);
      setShareOpen(true);
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
      <Drawer shouldScaleBackground={false}>
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
        </DrawerContent>
      </Drawer>

      {shareOpen && (
        <ShareSheet
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          spaceUrl={shareUrl}
        />
      )}
    </>
  );
}
