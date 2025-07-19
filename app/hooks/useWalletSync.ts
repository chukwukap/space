import { useEffect, useRef } from "react";
import { User } from "@/lib/types";
import { Address } from "viem";

interface Params {
  user: User | null;
  walletAddress: Address | undefined;
  mutate: () => Promise<void> | void;
}

export function useWalletSync({ user, walletAddress, mutate }: Params) {
  const patchedRef = useRef(false);

  useEffect(() => {
    if (patchedRef.current) return;

    if (!user || !user.id) return;
    if (!walletAddress) return;
    if (user.walletAddress === walletAddress) return;

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
