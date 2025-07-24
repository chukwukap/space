"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAddFrame, useMiniKit } from "@coinbase/onchainkit/minikit";
import Image from "next/image";
import MobileHeader from "./_components/mobileHeader";
import { Microphone } from "iconoir-react";
import { ThemeToggle } from "./_components/themeToggle";

import { Room } from "livekit-server-sdk";
import { SpaceMetadata } from "@/lib/types";
import { MicrophoneMuteSolid } from "iconoir-react";

/**
 * Space type extends Room with additional metadata fields.
 */

// SWR fetcher for spaces, parsing metadata for each space
const fetcher = async (url: string): Promise<Room[]> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  const data: Room[] = await res.json();
  return data;
};

export default function LandingPageClient() {
  const { setFrameReady, isFrameReady, context } = useMiniKit();
  const router = useRouter();
  const addFrame = useAddFrame();
  const [frameAdded, setFrameAdded] = useState(false);
  // Prepare frame on mount
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  // Add frame if not already added
  useEffect(() => {
    if (context && !context.client.added && !frameAdded) {
      (async () => {
        try {
          const added = await addFrame();
          setFrameAdded(Boolean(added));
        } catch (err) {
          console.error(err);
        }
      })();
    }
  }, [context, addFrame, frameAdded]);

  // SWR for live spaces, refresh every 5s
  const {
    data: spaces,
    error,
    isLoading,
  } = useSWR<Room[]>("/api/spaces", fetcher, {
    refreshInterval: 1000 * 60 * 0.1, //  0.1min = 6s
  });

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <MobileHeader
          title="Home"
          showBack={false}
          right={<ThemeToggle />}
          lowerVisible={false}
        />
        <section className="p-6 text-center text-lg font-medium">
          Loading spaces...
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen">
        <MobileHeader
          title="Home"
          showBack={false}
          right={<ThemeToggle />}
          lowerVisible={false}
        />
        <section className="p-6 text-center text-lg text-red-500 font-medium">
          Failed to load spaces.
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <MobileHeader
        title="Home"
        showBack={false}
        right={<ThemeToggle />}
        lowerVisible={false}
      />
      {/* Live Spaces heading */}

      {spaces && spaces.length > 0 && (
        <section id="explore" className="px-6 mt-4">
          <h2 className="text-2xl font-extrabold">Live Spaces</h2>
          <p className="text-sm text-muted-foreground -mt-1">
            Scroll to discover what&apos;s buzzing right now
          </p>
        </section>
      )}

      <section className="mt-6 flex flex-col gap-4 overflow-x-auto px-6 pb-8 pt-4 snap-x snap-mandatory scrollbar-none">
        <style>{`.scrollbar-none::-webkit-scrollbar{display:none}`}</style>
        {spaces && spaces.length > 0 ? (
          spaces.map((s) => (
            <SpaceCard
              key={s.name}
              space={s}
              onClick={() => {
                router.push(`/space/${s.name}`);
              }}
            />
          ))
        ) : (
          <div className="w-full flex flex-col items-center justify-center py-12 text-center">
            <MicrophoneMuteSolid className="w-12 h-12 text-muted-foreground" />
            <h4
              className="text-lg font-semibold mb-1"
              style={{ fontFamily: "Sora, sans-serif" }}
            >
              No Spaces are live right now
            </h4>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Check back soon or start your own to get the conversation going!
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

// Card for each space in the list
function SpaceCard({ space, onClick }: { space: Room; onClick: () => void }) {
  const metadata: SpaceMetadata = space.metadata
    ? JSON.parse(space.metadata)
    : null;
  // console.log(metadata);
  // console.log(space);
  if (!metadata) {
    return null;
  }
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      className="w-full cursor-pointer rounded-xl glass-card p-4 flex items-center gap-4"
      onClick={onClick}
    >
      <div className="w-12 h-12 rounded-full overflow-hidden bg-muted shrink-0">
        <Image
          src={metadata?.host?.pfpUrl ?? "/icon.png"}
          alt="host"
          width={48}
          height={48}
          className="object-cover w-full h-full"
        />
      </div>

      {/* Title & meta */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold leading-snug line-clamp-2">
          {metadata.title}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
          <Microphone className="w-3 h-3 text-destructive" />
          <span>{space.numParticipants ?? 1} listening</span>
          {space.activeRecording && (
            <span className="ml-2 px-1.5 py-0.5 bg-primary/20 text-primary rounded">
              REC
            </span>
          )}
        </p>
      </div>

      {/* Join badge */}
      <span className="text-sm font-medium px-3 py-1 rounded-full bg-primary text-primary-foreground shrink-0">
        Join
      </span>
    </motion.div>
  );
}
