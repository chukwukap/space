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
import { useUser } from "../providers/userProvider";
import { SpaceMetadata } from "@/lib/types";
import { Room } from "livekit-server-sdk";

/**
 * CreateSpaceButton is hidden on space details (live room) pages.
 */
export default function CreateSpaceButton() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, userMetadata } = useUser();

  const [title, setTitle] = useState("");
  const [record, setRecord] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

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
    if (!userMetadata) return;

    // If wallet not connected, prompt connect and refresh user
    // if (!walletAddress) {
    //   if (
    //     connectors &&
    //     connectors.length > 0 &&
    //     walletConnectStatus !== "pending"
    //   ) {
    //     try {
    //       connect({ connector: connectors[0] });
    //       await refreshUser();
    //     } catch {}
    //   }
    //   return;
    // }

    // If user is missing fid, refresh user and prompt
    if (!user?.fid) {
      return;
    }

    setCreating(true);
    setCreateError(null);

    const metadata: SpaceMetadata = {
      clientFid: userMetadata.clientFid,
      title: title.trim(),
      host: userMetadata,
      recording: record,
      ended: false,
    };

    try {
      const res = await fetch("/api/spaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metadata,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create space");
      }

      const livekitRoom: Room = await res.json();
      const path = `/space/${livekitRoom.name}?title=${encodeURIComponent(
        title,
      )}`;

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
              <span>Record Space (coming soon)</span>
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
    </>
  );
}
