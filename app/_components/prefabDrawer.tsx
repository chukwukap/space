"use client";

/**
 * PrefabDrawer – Space preview & join sheet
 * ----------------------------------------------------------
 * Displays key information (title, host, speakers, listener count)
 * and a prominent “Start listening” button. The drawer mirrors the
 * familiar Twitter-Spaces join sheet UX while remaining lightweight
 * and fully typed.
 */

import Image from "next/image";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Xmark } from "iconoir-react";
import { Room } from "livekit-server-sdk";
import clsx from "clsx";
import { HTMLAttributes } from "react";
import { SpaceMetadata } from "@/lib/types";

interface PrefabDrawerProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Currently selected space (can be null while closing)
   */
  space: Room | null;
  /**
   * Vaul Drawer open state
   */
  open: boolean;
  /**
   * Setter forwarded to Drawer.root
   */
  onOpenChange: (open: boolean) => void;
  /**
   * Called when user presses “Start listening”
   */
  onJoin: () => void;
}

export default function PrefabDrawer({
  space,
  open,
  onOpenChange,
  onJoin,
  className,
  ...rest
}: PrefabDrawerProps) {
  // Early-return if no space yet (prevents flash of empty drawer)
  if (!space) return null;

  const metadata: SpaceMetadata | null = space.metadata
    ? JSON.parse(space.metadata)
    : null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange} shouldScaleBackground>
      <DrawerContent
        className={clsx(
          "bg-card text-foreground rounded-t-2xl border border-border",
          className,
        )}
        {...rest}
      >
        {/* Header */}
        <DrawerHeader className="px-6 pb-1 text-center relative">
          {/* Quick close */}
          <DrawerClose asChild>
            <button
              className="absolute right-6 top-1 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close"
            >
              <Xmark className="w-5 h-5" />
            </button>
          </DrawerClose>

          <DrawerTitle
            className="text-lg font-semibold leading-snug line-clamp-2"
            style={{ fontFamily: "Sora, sans-serif" }}
          >
            {metadata?.title || space.name}
          </DrawerTitle>
        </DrawerHeader>

        {/* Host & Speakers */}
        <div className="flex items-center gap-3 px-6 mt-3 overflow-x-auto scrollbar-none">
          {/* Host */}
          {metadata?.host && (
            <Avatar
              src={metadata.host.pfpUrl}
              name={metadata.host.displayName || "Host"}
              role="Host"
            />
          )}
        </div>

        {/* Listener count */}
        <p className="px-6 mt-4 text-sm text-muted-foreground">
          +{Math.max(space.numParticipants - 2, 0).toLocaleString()} other
          listeners
        </p>

        {/* Mic hint */}
        <p className="px-6 mt-2 text-xs text-muted-foreground">
          Your mic will be off to start
        </p>

        {/* Footer */}
        <DrawerFooter className="pt-4 border-t border-border">
          <button
            onClick={onJoin}
            className="w-full py-3 rounded-full aurora-bg glow-hover text-white text-base font-semibold active:scale-[0.97] transition-transform"
          >
            Start listening
          </button>
          {/* Cancel / close for accessibility */}
          <DrawerClose asChild>
            <button className="mx-auto mt-1 text-sm text-muted-foreground">
              Close
            </button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

/* ------------------------------------------------------------------ */
/* Helper components                                                   */
/* ------------------------------------------------------------------ */

function Avatar({
  src,
  name,
  role,
}: {
  src?: string | null;
  name?: string;
  role: "Host" | "Speaker";
}) {
  return (
    <div className="flex flex-col items-center gap-1 min-w-[56px]">
      <div className="w-14 h-14 rounded-full overflow-hidden bg-muted">
        <Image
          src={src || "/icon.png"}
          alt={name || role}
          width={56}
          height={56}
          className="object-cover w-full h-full"
        />
      </div>
      <span className="text-xs font-medium truncate max-w-[56px]">
        {name || role}
      </span>
      <span className="text-[10px] text-muted-foreground">{role}</span>
    </div>
  );
}
