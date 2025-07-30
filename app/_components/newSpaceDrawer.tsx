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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Generates a high-entropy, professional room name for Sonic Space.
 * Uses crypto.getRandomValues for secure randomness and a readable prefix.
 */
function generateRoomName() {
  // 16 bytes = 128 bits of entropy, base36 for compactness
  const arr = new Uint8Array(16);
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(arr);
  } else {
    // Fallback for environments without crypto (shouldn't happen in browser)
    for (let i = 0; i < arr.length; i++)
      arr[i] = Math.floor(Math.random() * 256);
  }
  // Convert to base36 string for compact, URL-safe, and mostly unique names
  const randomPart = Array.from(arr)
    .map((b) => b.toString(36).padStart(2, "0"))
    .join("")
    .slice(0, 24);
  return `${randomPart}`;
}

/**
 * NewSpaceDrawer is hidden on space details (live room) pages.
 * Uses Sora font and Nebula palette from globals.css for a mobile-first, branded look.
 */
export default function NewSpaceDrawer() {
  const pathname = usePathname();
  const router = useRouter();
  const [title, setTitle] = useState("");

  // Hide button if on a space details page (/space/[room])
  const isSpaceDetails = /^\/space\/[^/]+/.test(pathname);

  if (isSpaceDetails) {
    return null;
  }

  // Handles creation of a new space
  async function handleCreateSpace() {
    if (!title.trim()) return;

    // Use high-entropy, professional room name
    const roomName = generateRoomName();
    const path = `/space/${roomName}?host=true&title=${encodeURIComponent(title)}`;
    router.push(path);
  }

  // Handles Enter key to create space
  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && title.trim()) {
      handleCreateSpace();
    }
  }

  return (
    <>
      <Drawer>
        <DrawerTrigger className="fixed bottom-24 right-6 w-16 h-16 rounded-full flex items-center justify-center glass-card border border-primary/30 bg-primary/80 text-primary-foreground shadow-2xl backdrop-blur-md z-50 font-sora">
          <Mic className="w-7 h-7 dark:text-white text-black" />
        </DrawerTrigger>

        <DrawerContent className="glass-card px-0 pb-10 text-foreground">
          <DrawerHeader className="text-center mb-4">
            <DrawerTitle className="text-2xl font-semibold">
              Create Tipspace
            </DrawerTitle>
          </DrawerHeader>

          <div className="px-4 pb-4 flex flex-col gap-4 ">
            <div className="flex flex-col gap-3">
              <Label>Space title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={handleInputKeyDown}
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
              Create Tipspace
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
