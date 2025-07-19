import { useEffect, useRef } from "react";
import { User } from "@/lib/types";
import { Context } from "@farcaster/frame-sdk";

interface Params {
  context: Context.FrameContext | null;
  user: User | null;
  mutate: () => Promise<void> | void;
}

export function useFarcasterOnboard({ context, user, mutate }: Params) {
  const postedRef = useRef(false);

  useEffect(() => {
    if (postedRef.current) return;
    if (!context) return;

    const userObj = context.user;

    const fid = userObj?.fid;

    if (!fid) return;

    if (user && user.walletAddress && user.fid && user.username && user.pfpUrl)
      return; // already onboarded

    (async () => {
      try {
        await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fid,
            username: user?.username ?? "",
            avatarUrl: user?.pfpUrl ?? "",
            address: user?.walletAddress ?? "",
          }),
        });
        postedRef.current = true;
        mutate?.();
      } catch (err) {
        console.error("[useFarcasterOnboard] error", err);
      }
    })();
  }, [context, user, mutate]);
}
