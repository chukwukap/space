"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
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
import { ShareAndroid, Copy } from "iconoir-react";
import { castInvite } from "@/lib/farcaster";
import { useAccount, useConnect } from "wagmi";
import { useUser } from "../providers/userProvider";
import { Space } from "@/lib/generated/prisma";

/**
 * CreateSpaceButton is hidden on space details (live room) pages.
 */
export default function CreateSpaceButton() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, refreshUser } = useUser();
  const { address: walletAddress } = useAccount();
  const { connect, connectors, status: connectStatus } = useConnect();

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

  /**
   * Handles the creation of a new Space.
   * Prompts wallet connect only when needed, and refreshes user after connect.
   * Navigates to the new space page after creation.
   */
  async function handleCreateSpace() {
    if (!title.trim()) return;
    if (!user) return;

    // If wallet not connected, prompt connect and refresh user
    if (!walletAddress) {
      setCreateError("Please connect your wallet to host a Space.");
      if (connectors && connectors.length > 0 && connectStatus !== "pending") {
        try {
          connect({ connector: connectors[0] });
          await refreshUser();
          toast.success("Wallet connected! Please try again.");
        } catch {
          toast.error("Failed to connect wallet.");
        }
      }
      return;
    }

    // If user is missing fid, refresh user and prompt
    if (!user?.fid) {
      setCreateError("Please complete your Farcaster profile to host a Space.");
      toast.error("Please complete your Farcaster profile to host a Space.");
    }

    setCreating(true);
    setCreateError(null);

    const hostFid = user?.fid;
    const hostAddress = walletAddress;

    try {
      const res = await fetch("/api/spaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          hostFid,
          hostId: user.id,
          hostAddress,
          recording: record,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create space");
      }

      const space: Space = await res.json();
      const path = `/space/${space.livekitName}`;
      setShareUrl(`${window.location.origin}${path}`);
      setOpen(true);
      toast.success("Space created! Redirecting you...");
      setTitle("");

      // Navigate to the new space page
      router.push(path);
    } catch (e: unknown) {
      setCreateError("Failed to create space");
      console.error(e);
      toast.error("Failed to create space");
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
            aria-label="Create Space"
            type="button"
            onClick={() => setOpen(true)}
          >
            <Mic className="w-7 h-7 dark:text-white text-black" />
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
                    if (!user?.fid) {
                      toast.error("Please connect your wallet to cast.");
                      return;
                    }
                    await castInvite(user.fid, {
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
