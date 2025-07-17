import { useEffect, useRef } from "react";
import { User } from "@/lib/types";

interface Params {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: any | null;
  user: User | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mutate: () => Promise<any> | void;
}

export function useFarcasterOnboard({ context, user, mutate }: Params) {
  const postedRef = useRef(false);

  useEffect(() => {
    if (postedRef.current) return;
    if (!context) return;

    const userObj = context.user as unknown as {
      fid?: number;
      username?: string;
      displayName?: string;
      name?: string;
      pfpUrl?: string;
    } | null;
    const clientObj = context.client as unknown as {
      fid?: number;
      clientFid?: number;
      username?: string;
      displayName?: string;
      name?: string;
      pfpUrl?: string;
    } | null;

    const fid = userObj?.fid ?? clientObj?.fid ?? clientObj?.clientFid;

    if (!fid) return;

    if (user) return; // already onboarded

    // Extract username & pfp
    const username =
      userObj?.username ??
      clientObj?.username ??
      userObj?.displayName ??
      clientObj?.displayName ??
      userObj?.name ??
      clientObj?.name ??
      "";
    const avatarUrl = userObj?.pfpUrl ?? clientObj?.pfpUrl ?? "";

    (async () => {
      try {
        await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fid, username, avatarUrl }),
        });
        postedRef.current = true;
        mutate?.();
      } catch (err) {
        console.error("[useFarcasterOnboard] error", err);
      }
    })();
  }, [context, user, mutate]);
}
