import { useEffect, useRef } from "react";
import { ParticipantMetadata, UserWithRelations } from "@/lib/types";
import { Context } from "@farcaster/frame-sdk";

interface Params {
  context: Context.FrameContext | null;
  user: UserWithRelations | null;
  userMetadata: ParticipantMetadata | null;
  mutate: () => Promise<void> | void;
}

export function useFarcasterOnboard({
  context,
  user,
  userMetadata,
  mutate,
}: Params) {
  const postedRef = useRef(false);

  useEffect(() => {
    if (postedRef.current) return;
    if (!context) return; // user not logged in

    if (user) return; // already onboarded

    (async () => {
      try {
        await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fid: context.user.fid,
            username: context.user.username ?? null,
            pfpUrl: context.user.pfpUrl ?? null,
            address: userMetadata?.address ?? null,
            displayName: context.user.displayName ?? null,
            farcasterClientIdOnboardedFrom: context.client.clientFid,
          }),
        });
        postedRef.current = true;
        mutate?.();
      } catch (err) {
        console.error("[useFarcasterOnboard] error", err);
      }
    })();
  }, [context, user, userMetadata, mutate]);
}
