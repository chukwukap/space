"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { SpaceMetadata } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Mic } from "lucide-react";
import { Room } from "livekit-server-sdk";
import Image from "next/image";
import dynamic from "next/dynamic";
import NotificationBanner from "./_components/notificationBanner";
import { useAddFrame, useMiniKit } from "@coinbase/onchainkit/minikit";
import { useAccount, useConnect } from "wagmi";
import { toast } from "sonner";
import MobileHeader from "./_components/mobileHeader";

// import MobileHeader from "./_components/mobileHeader";

const ShareSheet = dynamic(() => import("./_components/shareSheet"), {
  ssr: false,
});

/**
 * Space type extends Room with additional metadata fields.
 */
type Space = Room & SpaceMetadata;

export default function LandingClient() {
  const { setFrameReady, isFrameReady, context } = useMiniKit();
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const addFrame = useAddFrame();
  const [frameAdded, setFrameAdded] = useState(false);

  // State for the list of spaces

  const [spaces, setSpaces] = useState<Space[]>([]);
  console.log(spaces);
  // Drawer-controlled form state
  const [title, setTitle] = useState("");
  const [record, setRecord] = useState(false);
  // Loading and error state for space creation
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  useEffect(() => {
    // Only add frame if not already added and not already triggered
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
    const id = setInterval(fetchSpaces, 5_000);
    return () => clearInterval(id);
  }, []);

  /**
   * Prompt user to connect wallet if not connected.
   * Uses the first available connector.
   */
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

  /**
   * Handles the creation of a new Space by calling the POST /api/spaces endpoint.
   * If wallet is not connected, prompts user to connect immediately.
   * Uses fid as hostId if available, else uses wallet address.
   */
  async function handleCreateSpace() {
    if (!title.trim()) return;

    // Prompt wallet connect immediately if not connected
    if (!address) {
      promptWalletConnect();
      return;
    }

    // Security: Only allow if wallet is connected
    if (!isConnected) {
      setCreateError("Please connect your wallet to host a Space.");
      toast.error("Please connect your wallet to host a Space.");
      return;
    }

    setCreating(true);
    setCreateError(null);

    // Use fid if available, else use wallet address
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
        const error = await res.json();
        setCreateError(error?.error || "Failed to create space.");
        toast.error(error?.error || "Failed to create space.");
        setCreating(false);
        return;
      }

      const livekitRoom = await res.json();
      const path = `/space/${livekitRoom.name}?title=${encodeURIComponent(title)}`;
      setShareUrl(`${window.location.origin}${path}`);
      setShareOpen(true);
      toast.success("Space created! Share your link.");
    } catch (error: unknown) {
      console.error(error);
      setCreateError("Something went wrong. Please try again.");
      toast.error("Something went wrong. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <MobileHeader title="Live Spaces" showBack={false} right={<>hello</>} />
      {/* Live Spaces heading */}
      <section id="explore" className="px-6 mt-4">
        <h2 className="text-2xl font-extrabold">Live Spaces</h2>
        <p className="text-sm text-muted-foreground -mt-1">
          {"Scroll to discover what's buzzing right now"}
        </p>
      </section>
      {/* for testing */}
      <>{JSON.stringify(context)}</>
      <section className="mt-6 flex flex-col gap-4 overflow-x-auto px-6 pb-8 pt-4 snap-x snap-mandatory scrollbar-none">
        <style>{`.scrollbar-none::-webkit-scrollbar{display:none}`}</style>
        {mockSpaces.map((s) => (
          <SpaceCard
            key={s.name}
            // @ts-expect-error - mock spaces
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
  const listeners =
    space.numParticipants ?? Math.floor(Math.random() * 500) + 10;

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      className="w-full cursor-pointer rounded-xl glass-card p-4 flex items-center gap-4"
      onClick={onClick}
    >
      {/* Host avatar placeholder */}
      <div className="w-12 h-12 rounded-full overflow-hidden bg-muted shrink-0">
        <Image
          src="/icon.png"
          alt="host"
          width={48}
          height={48}
          className="object-cover w-full h-full"
        />
      </div>

      {/* Title & meta */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold leading-snug line-clamp-2">
          {space.title || "Untitled Space"}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
          <Mic className="w-3 h-3 text-destructive" />
          <span>{listeners} listening</span>
          {space.recording && (
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

const mockSpaces = [
  {
    sid: "spc_001",
    name: "defi-deep-dive",
    metadata: "{}",
    creationTime: 1718457600,
    title: "DeFi Deep Dive",
    hostId: "fid_1001",
    recording: false,
  },
  {
    sid: "spc_002",
    name: "nft-night-chat",
    metadata: "{}",
    creationTime: 1718461200,
    title: "NFT Night Chat",
    hostId: "fid_1002",
    recording: true,
  },
  {
    sid: "spc_003",
    name: "builder-banter",
    metadata: "{}",
    creationTime: 1718464800,
    title: "Builder Banter",
    hostId: "fid_1003",
    recording: false,
  },
  {
    sid: "spc_004",
    name: "onchain-gaming",
    metadata: "{}",
    creationTime: 1718468400,
    title: "On-Chain Gaming Roundtable",
    hostId: "fid_1004",
    recording: true,
  },
  {
    sid: "spc_005",
    name: "solidity-surgery",
    metadata: "{}",
    creationTime: 1718472000,
    title: "Solidity Surgery",
    hostId: "fid_1005",
    recording: false,
  },
  {
    sid: "spc_006",
    name: "governance-gossip",
    metadata: "{}",
    creationTime: 1718475600,
    title: "Governance Gossip",
    hostId: "fid_1006",
    recording: false,
  },
  {
    sid: "spc_007",
    name: "rollup-roundup",
    metadata: "{}",
    creationTime: 1718479200,
    title: "Rollup Round-up",
    hostId: "fid_1007",
    recording: true,
  },
  {
    sid: "spc_008",
    name: "vc-viewpoint",
    metadata: "{}",
    creationTime: 1718482800,
    title: "VC Viewpoint",
    hostId: "fid_1008",
    recording: false,
  },
  {
    sid: "spc_009",
    name: "ai-meets-crypto",
    metadata: "{}",
    creationTime: 1718486400,
    title: "AI meets Crypto",
    hostId: "fid_1009",
    recording: true,
  },
  {
    sid: "spc_010",
    name: "dao-town-hall",
    metadata: "{}",
    creationTime: 1718490000,
    title: "DAO Town Hall",
    hostId: "fid_1010",
    recording: false,
  },
  {
    sid: "spc_011",
    name: "layers-lattes",
    metadata: "{}",
    creationTime: 1718493600,
    title: "Layers & Lattes ☕",
    hostId: "fid_1011",
    recording: false,
  },
  {
    sid: "spc_012",
    name: "privacy-protocols",
    metadata: "{}",
    creationTime: 1718497200,
    title: "Privacy Protocols AMA",
    hostId: "fid_1012",
    recording: true,
  },
  {
    sid: "spc_013",
    name: "zkevm-zoners",
    metadata: "{}",
    creationTime: 1718500800,
    title: "zkEVM Zone",
    hostId: "fid_1013",
    recording: false,
  },
  {
    sid: "spc_014",
    name: "wallet-war-stories",
    metadata: "{}",
    creationTime: 1718504400,
    title: "Wallet War Stories",
    hostId: "fid_1014",
    recording: false,
  },
  {
    sid: "spc_015",
    name: "reactive-research",
    metadata: "{}",
    creationTime: 1718508000,
    title: "Reactive Research",
    hostId: "fid_1015",
    recording: true,
  },
  {
    sid: "spc_016",
    name: "base-builder-time",
    metadata: "{}",
    creationTime: 1718511600,
    title: "Base Builder Time",
    hostId: "fid_1016",
    recording: false,
  },
  {
    sid: "spc_017",
    name: "tokenomics-talk",
    metadata: "{}",
    creationTime: 1718515200,
    title: "Tokenomics Talk",
    hostId: "fid_1017",
    recording: true,
  },
  {
    sid: "spc_018",
    name: "security-sunday",
    metadata: "{}",
    creationTime: 1718518800,
    title: "Security Sunday",
    hostId: "fid_1018",
    recording: false,
  },
  {
    sid: "spc_019",
    name: "design-in-defi",
    metadata: "{}",
    creationTime: 1718522400,
    title: "Design in DeFi",
    hostId: "fid_1019",
    recording: true,
  },
  {
    sid: "spc_020",
    name: "rugpull-radio",
    metadata: "{}",
    creationTime: 1718526000,
    title: "Rugpull Radio",
    hostId: "fid_1020",
    recording: false,
  },
];
