import { useEffect, useRef } from "react";
import { UserWithRelations } from "@/lib/types";
import { Address } from "viem";

interface Params {
  user: UserWithRelations | null;
  address: Address | null;
  mutate: () => Promise<void> | void;
}

export function useFarcasterOnboard({ user, address, mutate }: Params) {
  const postedRef = useRef(false);

  useEffect(() => {
    if (postedRef.current) return;
    if (!address) return; // user not logged in

    if (user) return; // already onboarded

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
  }, [address, user, mutate]);
}
