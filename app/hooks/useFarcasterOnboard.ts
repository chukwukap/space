import { useEffect, useRef } from "react";
import { User } from "@/lib/types";
import { Context } from "@farcaster/frame-sdk";
import { useAccount } from "wagmi";

interface Params {
  context: Context.FrameContext | null;
  user: User | null;
  mutate: () => Promise<void> | void;
}

export function useFarcasterOnboard({ context, user, mutate }: Params) {
  const { address } = useAccount();
  const postedRef = useRef(false);

  useEffect(() => {
    if (postedRef.current) return;
    if (!context) return;

    const userObj = context.user;

    const fid = userObj?.fid;

    if (!fid) return;

    if (user) return; // already onboarded

    // Extract username & pfp
    const username = userObj?.username ?? userObj?.displayName ?? "";
    const avatarUrl = userObj?.pfpUrl ?? "";

    (async () => {
      try {
        await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fid,
            username,
            avatarUrl,
            address,
          }),
        });
        postedRef.current = true;
        mutate?.();
      } catch (err) {
        console.error("[useFarcasterOnboard] error", err);
      }
    })();
  }, [context, user, mutate, address]);
}
