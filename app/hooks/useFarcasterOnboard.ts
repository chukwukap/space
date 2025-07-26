import { useEffect, useRef } from "react";
import { FCContext, UserWithRelations } from "@/lib/types";

interface Params {
  user: UserWithRelations | null;
  farcasterContext: FCContext | null;
  mutate: () => Promise<void> | void;
}

export function useFarcasterOnboard({
  user,
  farcasterContext,
  mutate,
}: Params) {
  const postedRef = useRef(false);

  useEffect(() => {
    if (postedRef.current) return;
    if (!farcasterContext) return; // user not logged in

    if (user) return; // already onboarded

    (async () => {
      try {
        await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fid: farcasterContext.farcasterUser.fid,
            username: farcasterContext.farcasterUser.username ?? null,
            pfpUrl: farcasterContext.farcasterUser.pfpUrl ?? null,
            address: farcasterContext?.farcasterUser.address ?? null,
            displayName: farcasterContext.farcasterUser.displayName ?? null,
            farcasterClientIdOnboardedFrom:
              farcasterContext.farcasterClient.clientFid,
          }),
        });
        postedRef.current = true;
        mutate?.();
      } catch (err) {
        console.error("[useFarcasterOnboard] error", err);
      }
    })();
  }, [farcasterContext, user, mutate]);
}
