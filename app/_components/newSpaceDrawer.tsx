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

/**
 * NewSpaceDrawer is hidden on space details (live room) pages.
 * Uses Sora font and Nebula palette from globals.css for a mobile-first, branded look.
 */
export default function NewSpaceDrawer() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, userMetadata } = useUser();
  const [title, setTitle] = useState("");
  const [open, setOpen] = useState(false);

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
    const path = `/space/${roomName}?host=true&title=${encodeURIComponent(title)}&record=false`;
    router.push(path);
  }

  return (
    <>
      <Drawer shouldScaleBackground={false} open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <button
            id="create-space-btn"
            className="fixed bottom-24 right-6 w-16 h-16 rounded-full flex items-center justify-center glass-card border border-primary/30 bg-primary/80 text-primary-foreground shadow-2xl backdrop-blur-md z-50 font-sora"
            aria-label="Create Space"
            type="button"
            onClick={() => setOpen(true)}
            style={{
              background: "hsl(var(--primary) / 0.8)",
              color: "hsl(var(--primary-foreground))",
              borderColor: "hsl(var(--primary) / 0.3)",
              fontFamily: "Sora, sans-serif",
            }}
          >
            <Mic className="w-7 h-7 dark:text-white text-black" />
          </button>
        </DrawerTrigger>

        <DrawerContent
          className="glass-card aurora-bg backdrop-blur-xl rounded-t-3xl border border-white/10 px-0 pb-10 text-foreground font-sora"
          style={{
            background:
              "linear-gradient(115deg, hsl(var(--primary) / 0.45) 0%, hsl(var(--secondary) / 0.45) 50%, hsl(var(--accent) / 0.45) 100%)",
            color: "hsl(var(--foreground))",
            fontFamily: "Sora, sans-serif",
          }}
        >
          <div className="w-full px-8 pt-8 flex flex-col gap-6">
            <DrawerHeader className="text-center mb-4">
              <DrawerTitle
                className="text-2xl font-bold tracking-tight font-sora"
                style={{
                  color: "hsl(var(--primary))",
                  fontFamily: "Sora, sans-serif",
                }}
              >
                Create TipSpace
              </DrawerTitle>
            </DrawerHeader>

            <div className="flex flex-col gap-3">
              <label
                className="text-left text-sm font-semibold font-sora"
                style={{
                  color: "hsl(var(--foreground))",
                  fontFamily: "Sora, sans-serif",
                }}
              >
                Space title
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="px-4 py-2 rounded-lg bg-input text-foreground placeholder:text-muted-foreground font-sora border border-border focus:ring-2 focus:ring-primary outline-none transition"
                placeholder="What are we talking about?"
                maxLength={64}
                autoFocus
                spellCheck
                aria-label="Space title"
                style={{
                  background: "hsl(var(--input))",
                  color: "hsl(var(--foreground))",
                  borderColor: "hsl(var(--border))",
                  fontFamily: "Sora, sans-serif",
                }}
              />
            </div>
            {/* 
            <div className="flex items-center justify-between">
              <span
                className="text-sm font-sora text-muted-foreground"
                style={{
                  color: "hsl(var(--muted-foreground))",
                  fontFamily: "Sora, sans-serif",
                }}
              >
                Record Space (coming soon)
              </span>
              <input
                type="checkbox"
                checked={record}
                onChange={(e) => setRecord(e.target.checked)}
                className="w-5 h-5 accent-primary"
                disabled
                aria-label="Record Space (coming soon)"
                style={{
                  accentColor: "hsl(var(--primary))",
                }}
              />
            </div> */}

            <Button
              className="w-full font-sora text-lg rounded-xl shadow-lg bg-primary/90 hover:bg-primary focus:ring-2 focus:ring-primary/60 transition"
              onClick={handleCreateSpace}
              disabled={!title.trim()}
              style={{
                background: "hsl(var(--primary) / 0.9)",
                color: "hsl(var(--primary-foreground))",
                fontFamily: "Sora, sans-serif",
                borderRadius: "1rem",
                boxShadow: "0 4px 24px 0 hsl(var(--primary) / 0.15)",
              }}
            >
              Create TipSpace
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
