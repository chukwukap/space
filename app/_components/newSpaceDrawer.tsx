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
import { useUser } from "../providers/userProvider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * NewSpaceDrawer is hidden on space details (live room) pages.
 * Uses Sora font and Nebula palette from globals.css for a mobile-first, branded look.
 */
export default function NewSpaceDrawer() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, userMetadata } = useUser();
  const [title, setTitle] = useState("");

  // Hide button if on a space details page (/space/[room])
  const isSpaceDetails = /^\/space\/[^/]+/.test(pathname);

  if (isSpaceDetails) {
    // Do not render the button in a live room
    return null;
  }

  /**
   * Handles the creation of a new Sonic Space.
   * Instead of calling an API, encode all variables into the URL and navigate.
   */
  async function handleCreateSpace() {
    if (!title.trim()) return;

    if (!userMetadata) return;

    // If user is missing fid, refresh user and prompt
    if (!user?.fid) {
      return;
    }
    // Generate a unique room name (client-side, e.g. using timestamp + fid)
    const roomName = `sonicspace-${user.fid}-${Date.now()}`;
    // Compose the path with all required parameters
    const path = `/space/${roomName}?host=true&title=${encodeURIComponent(title)}`;
    router.push(path);
  }

  return (
    <>
      <Drawer>
        <DrawerTrigger>
          <button
            className="fixed bottom-24 right-6 w-16 h-16 rounded-full flex items-center justify-center glass-card border border-primary/30 bg-primary/80 text-primary-foreground shadow-2xl backdrop-blur-md z-50 font-sora"
            aria-label="Create Space"
          >
            <Mic className="w-7 h-7 dark:text-white text-black" />
          </button>
        </DrawerTrigger>

        <DrawerContent className="glass-card px-0 pb-10 text-foreground">
          <DrawerHeader className="text-center mb-4">
            <DrawerTitle className="text-2xl font-semibold">
              Create TipSpace
            </DrawerTitle>
          </DrawerHeader>

          <div className="flex flex-col gap-3">
            <Label>Space title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What are we talking about?"
              maxLength={64}
              autoFocus
              spellCheck
              aria-label="Space title"
            />
          </div>

          <Button
            className="w-full"
            onClick={handleCreateSpace}
            disabled={!title.trim()}
          >
            Create TipSpace
          </Button>
        </DrawerContent>
      </Drawer>
    </>
  );
}
