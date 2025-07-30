import { useEffect, useRef } from "react";
import { UserWithRelations } from "@/lib/types";
import { Address } from "viem";
import { useConnect } from "wagmi";

/**
 * Params for useFarcasterOnboard hook
 */
interface Params {
  user: UserWithRelations | null;
  address: Address | null;
  mutate: () => Promise<void> | void;
}

/**
 * useFarcasterOnboard
 * Handles onboarding a user to Farcaster, prompting wallet connection if not logged in.
 */
export function useFarcasterOnboard({ user, address, mutate }: Params) {
  const postedRef = useRef(false);
  const { connect, connectors, status } = useConnect();

  useEffect(() => {
    if (postedRef.current) return;
    if (user) return; // already onboarded

    // If user not logged in, prompt wallet connect using wagmi
    if (!address) {
      // Only prompt if not already connecting
      if (status !== "pending" && connectors && connectors.length > 0) {
        connect({ connector: connectors[0] });
      }
      return;
    }

    (async () => {
      try {
        await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: address,
            address: address,
          }),
        });
        postedRef.current = true;
        mutate?.();
      } catch (err) {
        console.error("[useFarcasterOnboard] error", err);
      }
    })();
  }, [address, user, mutate, connect, connectors, status]);
}
