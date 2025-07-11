"use client";

import { useEffect, useState } from "react";

export interface ViewerInfo {
  fid: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
  address?: string;
}

/**
 * useFarcasterViewer attempts to detect the Farcaster Mini App SDK and, if available,
 * returns basic viewer information (fid, username, etc.).
 *
 * It safely no-ops when running outside Farcaster so our app can render on the
 * public web too.
 */
export function useFarcasterViewer() {
  const [viewer, setViewer] = useState<ViewerInfo | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        // The SDK is only available inside Warpcast; suppress TS error when developing locally
        // @ts-expect-error - package may be absent during local dev
        const mod = await import("@farcaster/miniapp-sdk");
        const { sdk } = mod;
        // Inform Warpcast that the app is ready (hides loading spinner)
        await sdk.actions.ready?.();
        // Obtain context which includes viewer details
        const ctx = await sdk.context.get();
        if (!cancelled && ctx?.viewer) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const v = ctx.viewer as any;
          setViewer({
            fid: v.fid,
            username: v.username ?? v.handle,
            displayName: v.displayName ?? v.name,
            pfpUrl: v.pfpUrl ?? v.pfp?.url,
            address: v.address,
          });
        }
      } catch {
        // SDK not available (e.g., local browser) – ignore silently
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  return viewer;
}
