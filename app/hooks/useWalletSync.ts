import { UserWithRelations } from "@/lib/types";
import { useEffect, useRef } from "react";
import { Address } from "viem";

interface Params {
  user: UserWithRelations | null;
  walletAddress: Address | undefined;
  mutate: () => Promise<void> | void;
}

export function useWalletSync({ user, walletAddress, mutate }: Params) {
  const patchedRef = useRef(false);

  useEffect(() => {
    if (patchedRef.current) return;

    if (!user || !user.id) return; // user not found
    if (!walletAddress) return; // wallet not connected
    if (user.address === walletAddress) return;

    (async () => {
      try {
        await fetch("/api/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, address: walletAddress }),
        });
        patchedRef.current = true;
        mutate?.();
      } catch (err) {
        console.error("[useWalletSync] error", err);
      }
    })();
  }, [user, walletAddress, mutate]);
}
