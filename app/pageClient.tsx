"use client";

import { useEffect, useState } from "react";
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
    setCreating(true);
    setCreateError(null);

    try {
      const res = await fetch("/api/spaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          hostId: String(user.user?.fid || "testUser"), // TODO: remove testUser
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
      router.push(
        `/space/${livekitRoom.name}?title=${encodeURIComponent(title)}`,
      );
    } catch (error: unknown) {
      console.error(error);
      setCreateError("Something went wrong. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen ">
      {/* Section heading */}
      <section className="px-6 mt-6">
        <h2 className="text-2xl font-extrabold">Happening Now</h2>
        <p className="text-sm text-gray-400 -mt-1">Spaces going on right now</p>
      </section>

      <section className="mt-6 space-y-6 px-4 flex-1 overflow-y-auto">
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
          <button className="absolute bottom-24 right-6 w-16 h-16 rounded-full bg-violet-600 hover:bg-violet-700 flex items-center justify-center shadow-xl">
            <Microphone className="w-7 h-7" />
          </button>
        </DrawerTrigger>

        <DrawerContent className="bg-card rounded-t-2xl border border-border px-0 pb-10 text-foreground">
          <div className="w-full px-6 pt-6 flex flex-col gap-4">
            <DrawerHeader className="text-center mb-4">
              <DrawerTitle>Create your Space</DrawerTitle>
            </DrawerHeader>

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What do you want to talk about?"
              className="w-full px-4 py-2 rounded-lg border bg-transparent mb-4"
              disabled={creating}
            />

            <label className="flex items-center gap-2 mb-6 cursor-pointer select-none text-sm">
              <input
                type="checkbox"
                checked={record}
                onChange={(e) => setRecord(e.target.checked)}
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
    </div>
  );
}

function SpaceCard({ space, onClick }: { space: Space; onClick: () => void }) {
  return (
    <article
      className="rounded-2xl bg-violet-600/90 hover:bg-violet-600 transition-colors p-4 space-y-4 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center gap-2 text-xs uppercase font-semibold">
        <Microphone className="text-muted-foreground" />
        LIVE
      </div>

      <h3 className="text-xl font-bold leading-snug">{space.title}</h3>

      <div className="flex items-center gap-2 text-sm">
        <div className="flex -space-x-2">
          {Array.from({ length: space.numParticipants }).map((_, i) => (
            <div
              key={i}
              className="w-7 h-7 rounded-full bg-violet-400 border-2 border-violet-600 overflow-hidden"
            >
              <Image
                width={28}
                height={28}
                src="/icon.png"
                alt="pfp"
                className="object-cover w-full h-full"
              />
            </div>
          ))}
        </div>
        <span>{space.numParticipants} listening</span>
      </div>

      <div className="flex items-center gap-2 text-sm pt-2 border-t border-white/20">
        <span className="w-6 h-6 rounded-full bg-yellow-500 inline-block" />
        <span className="font-semibold">{space.hostId}</span>
      </div>
    </article>
  );
}
