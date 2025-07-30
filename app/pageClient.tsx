"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { useAddFrame, useMiniKit } from "@coinbase/onchainkit/minikit";
import MobileHeader from "./_components/mobileHeader";
import { ThemeToggle } from "./_components/themeToggle";
import { MicrophoneMuteSolid } from "iconoir-react";
import { RoomWithMetadata } from "@/lib/types";
import { SpaceCard } from "./_components/spaceCard";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useAccount, useConnect } from "wagmi";

/**
 * Prefab: SpacePreviewDrawer
 * Shows info about a space and allows user to start listening.
 * Move to its own file if needed.
 */
function SpacePreviewDrawer({
  open,
  onOpenChange,
  space,
  onStartListening,
  isConnected,
  connect,
  connectors,
  isConnecting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  space: RoomWithMetadata | null;
  onStartListening: (space: RoomWithMetadata) => void;
  isConnected: boolean;
  connect: ReturnType<typeof useConnect>["connect"];
  connectors: ReturnType<typeof useConnect>["connectors"];
  isConnecting: boolean;
}) {
  if (!space) return null;

  // Fallbacks for missing metadata
  const hostName = space.metadata.host.displayName || "Unknown Host";
  const hostAvatar =
    space.metadata.host.avatarUrl ||
    "https://api.dicebear.com/7.x/shapes/svg?seed=" +
      encodeURIComponent(hostName);

  // Handler for "Start Listening" button
  const handleStartListeningClick = () => {
    if (!isConnected) {
      // Call connect from wagmi as soon as possible
      if (connectors && connectors.length > 0) {
        connect({ connector: connectors[0] });
      }
      return;
    }
    onOpenChange(false);
    onStartListening(space);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary shadow-md mb-2">
            {/* Host avatar */}
            <Image
              src={hostAvatar}
              alt={hostName}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              width={64}
              height={64}
            />
          </div>
          <DrawerTitle
            className="text-xl font-extrabold"
            style={{ fontFamily: "Sora, sans-serif" }}
          >
            {space.metadata?.title || space.name}
          </DrawerTitle>
          <DrawerDescription className="text-base text-muted-foreground">
            Hosted by <span className="font-semibold">{hostName}</span>
          </DrawerDescription>
          {space.metadata.participants && (
            <p className="text-sm text-muted-foreground mt-2 max-w-xs text-center">
              {space.metadata.participants
                .map((p) => p.user.displayName)
                .join(", ")}
            </p>
          )}
        </DrawerHeader>
        <div className="flex flex-row items-center justify-center gap-4 mt-4 mb-2">
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold">
              {space.metadata.participants.length}
            </span>
            <span className="text-xs text-muted-foreground">Listening</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold">
              {
                space.metadata.participants.filter((p) => p.role === "SPEAKER")
                  .length
              }
            </span>
            <span className="text-xs text-muted-foreground">Speakers</span>
          </div>
        </div>
        <DrawerFooter>
          <Button
            className="w-full text-lg py-3 rounded-full bg-primary text-primary-foreground font-bold shadow-lg"
            onClick={handleStartListeningClick}
            aria-label="Start listening"
            disabled={isConnecting}
          >
            {isConnected
              ? "Start Listening"
              : isConnecting
                ? "Connecting..."
                : "Connect to Listen"}
          </Button>
          <DrawerClose asChild>
            <Button
              variant="ghost"
              className="w-full text-base py-2 mt-1"
              aria-label="Close"
            >
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

// SWR fetcher for spaces, parsing metadata for each space
const fetcher = async (url: string): Promise<RoomWithMetadata[]> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  const data: RoomWithMetadata[] = await res.json();
  return data;
};

export default function LandingPageClient() {
  const { setFrameReady, isFrameReady, context } = useMiniKit();
  const router = useRouter();
  const addFrame = useAddFrame();
  const [frameAdded, setFrameAdded] = useState(false);

  // Wagmi hooks for wallet connection
  const { isConnected } = useAccount();
  const { connect, connectors, status } = useConnect();
  const isConnecting = status === "pending";

  // Drawer state for space preview
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState<RoomWithMetadata | null>(
    null,
  );

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

  // SWR for live spaces, refresh every 6s
  const {
    data: spaces,
    error,
    isLoading,
  } = useSWR<RoomWithMetadata[]>("/api/room", fetcher, {
    refreshInterval: 1000 * 6,
  });

  // Handler for clicking a space card
  const handleSpaceClick = (space: RoomWithMetadata) => {
    setSelectedSpace(space);
    setPreviewOpen(true);
  };

  // Handler for "Start Listening"
  const handleStartListening = (space: RoomWithMetadata) => {
    router.push(`/space/${space.name}`);
  };

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
              onClick={() => handleSpaceClick(s)}
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
      {/* Space Preview Drawer */}
      <SpacePreviewDrawer
        open={previewOpen}
        onOpenChange={(open) => {
          setPreviewOpen(open);
          if (!open) setSelectedSpace(null);
        }}
        space={selectedSpace}
        onStartListening={handleStartListening}
        isConnected={isConnected}
        connect={connect}
        connectors={connectors}
        isConnecting={isConnecting}
      />
    </div>
  );
}
