"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
// CountUp no longer needed after simplifying hero
import { useRouter } from "next/navigation";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { SpaceMetadata } from "@/lib/types";
import { useUser } from "./providers/userProvider";
import { Button } from "@/components/ui/button";
import { Microphone } from "iconoir-react";
import { Room } from "livekit-server-sdk";
import Image from "next/image";
import dynamic from "next/dynamic";
import NotificationBanner from "./_components/notificationBanner";

const ShareSheet = dynamic(() => import("./_components/shareSheet"), {
  ssr: false,
});

/**
 * Space type extends Room with additional metadata fields.
 */
type Space = Room & SpaceMetadata;

export default function LandingClient() {
  const router = useRouter();
  const user = useUser();

  // State for the list of spaces
  const [spaces, setSpaces] = useState<Space[]>([]);
  // Drawer-controlled form state
  const [title, setTitle] = useState("");
  const [record, setRecord] = useState(false);
  // Loading and error state for space creation
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  /* ----------------------------------------- */
  /* Fetch live spaces list every 5 s          */
  /* ----------------------------------------- */
  useEffect(() => {
    async function fetchSpaces() {
      try {
        const res = await fetch("/api/spaces");
        const data = await res.json();

        if (res.ok) {
          // Parse metadata for each space and update state
          const spaces = data.map((space: Space) => {
            const metadata = JSON.parse(
              space.metadata ?? "{}",
            ) as SpaceMetadata;
            return {
              ...space,
              title: metadata.title,
              hostId: metadata.hostId,
            };
          });
          setSpaces(spaces);
        }
      } catch {
        // Silently ignore fetch errors for now
      }
    }
    fetchSpaces();
    // const id = setInterval(fetchSpaces, 5_000);
    // return () => clearInterval(id);
  }, []);

  /**
   * Handles the creation of a new Space by calling the POST /api/spaces endpoint.
   */
  async function handleCreateSpace() {
    if (!title.trim()) return;
    if (!user.user?.fid) {
      alert("Please connect Farcaster to host a Space.");
      return;
    }
    setCreating(true);
    setCreateError(null);

    try {
      const res = await fetch("/api/spaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          hostId: String(user.user.fid),
          recording: record,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        setCreateError(error?.error || "Failed to create space.");
        setCreating(false);
        return;
      }

      const livekitRoom = await res.json();
      const path = `/space/${livekitRoom.name}?title=${encodeURIComponent(title)}`;
      setShareUrl(`${window.location.origin}${path}`);
      setShareOpen(true);
    } catch (error: unknown) {
      console.error(error);
      setCreateError("Something went wrong. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen ">
      {/* HERO */}
      <section className="relative bg-gradient-to-br from-primary/30 via-secondary/20 to-accent/30 rounded-b-[2rem] pb-20 pt-24 px-6 text-center shadow-lg overflow-hidden">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-4xl sm:text-5xl font-extrabold leading-tight drop-shadow-md"
        >
          Talk. Earn. Own it.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
          className="mt-3 text-lg text-foreground/70 max-w-xl mx-auto"
        >
          Host live audio shows, let fans tip in USDC, and grow an audience you
          actually control.
        </motion.p>

        {/* Hero intentionally minimal – no live stats to maintain focus */}
      </section>

      {/* Section heading */}
      <section id="explore" className="px-6 mt-10">
        <h2 className="text-2xl font-extrabold">Live Spaces</h2>
        <p className="text-sm text-muted-foreground -mt-1">
          {"Scroll to discover what's buzzing right now"}
        </p>
      </section>

      <section className="mt-6 flex gap-4 overflow-x-auto px-6 pb-8 pt-4 snap-x snap-mandatory scrollbar-none">
        {/* Hide default scrollbar */}
        <style>{`.scrollbar-none::-webkit-scrollbar{display:none}`}</style>
        {spaces.map((s) => (
          <SpaceCard
            key={s.name}
            space={s}
            onClick={() =>
              router.push(
                `/space/${s.name}?title=${encodeURIComponent(s.title)}`,
              )
            }
          />
        ))}
      </section>

      {/* Create Space Drawer */}
      <Drawer shouldScaleBackground={false}>
        <DrawerTrigger asChild>
          <button
            id="create-space-btn"
            className="fixed bottom-24 right-6 w-16 h-16 rounded-full flex items-center justify-center glass-card glow-hover border-primary/30 bg-primary/80 text-primary-foreground shadow-2xl backdrop-blur-md"
          >
            <Microphone className="w-7 h-7" />
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
                placeholder="e.g. Building in public in 2025"
                className="w-full px-4 py-3 rounded-xl bg-muted/20 focus:bg-background border border-border focus:ring-2 focus:ring-primary/50 outline-none transition-colors disabled:opacity-50"
                disabled={creating}
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer select-none text-sm">
              <input
                type="checkbox"
                checked={record}
                onChange={(e) => setRecord(e.target.checked)}
                className="h-5 w-5 rounded-md border border-border accent-primary"
              />
              Record this Space (coming soon)
            </label>

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
      <NotificationBanner />
      {shareOpen && (
        <ShareSheet
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          spaceUrl={shareUrl}
        />
      )}
    </div>
  );
}

function SpaceCard({ space, onClick }: { space: Space; onClick: () => void }) {
  return (
    <motion.article
      whileHover={{ scale: 1.04 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="relative w-64 shrink-0 snap-center cursor-pointer rounded-3xl overflow-hidden glow-hover"
      onClick={onClick}
    >
      {/* Gradient backdrop */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-accent opacity-30" />
      {/* Frosted glass overlay */}
      <div className="relative p-5 glass-card backdrop-blur-[6px] flex flex-col h-full">
        <div className="flex items-center gap-2 text-xs uppercase font-semibold mb-3">
          <Microphone className="w-4 h-4 text-destructive animate-pulse" />
          Live
        </div>

        <h3 className="text-lg font-bold leading-snug mb-4 line-clamp-3 flex-1">
          {space.title || "Untitled Space"}
        </h3>

        <div className="flex items-center gap-2 text-sm">
          <div className="flex -space-x-2">
            {Array.from({ length: space.numParticipants })
              .slice(0, 3)
              .map((_, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-muted border-2 border-background overflow-hidden"
                >
                  <Image
                    width={32}
                    height={32}
                    src="/icon.png"
                    alt="pfp"
                    className="object-cover w-full h-full"
                  />
                </div>
              ))}
          </div>
          <span className="ml-1 text-xs font-medium bg-background/60 px-2 py-0.5 rounded-full">
            {space.numParticipants} listening
          </span>
        </div>
      </div>
    </motion.article>
  );
}

// LandingStat removed – hero kept intentionally simple
