import { useState, useCallback } from "react";

import { UserWithRelations } from "@/lib/types";
import { useConnect, useAccount } from "wagmi";
import { toast } from "sonner";
import { REACTION_EMOJIS } from "@/lib/constants";
import { ReactionType } from "@/lib/generated/prisma";
import { LocalParticipant } from "livekit-client";

export function useTipReaction({
  localParticipant,
  user,
  hostId,
  spaceId,
  addFloatingReaction,
}: {
  localParticipant: LocalParticipant;
  user: UserWithRelations | null;
  hostId: string;
  spaceId: string;
  addFloatingReaction: (emoji: string) => void;
}) {
  const { connect, connectors } = useConnect();
  const { address } = useAccount();
  const [reactionLoading, setReactionLoading] = useState(false);

  const handleSendReaction = useCallback(
    async (type: ReactionType) => {
      if (!user) {
        return;
      }

      const emoji = REACTION_EMOJIS[type];
      if (!emoji) {
        return;
      }
      setReactionLoading(true);
      // Optimistic UI
      addFloatingReaction(emoji);
      localParticipant.publishData(
        new TextEncoder().encode(
          JSON.stringify({ type: "reaction", reactionType: type }),
        ),
      );

      try {
        let addr = address;
        if (!addr) {
          connect({ connector: connectors[0] });
          addr = address;
          return;
        }

        if (!user.spendPerm) {
          // TODO: Implement spend permission
        }

        const res = await fetch("/api/reactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            spaceId: spaceId,
            userId: user.id,
            receiverId: hostId,
            type,
          }),
        });

        if (!res.ok) {
          const errMsg = await res.text();
          throw new Error(`API Error: ${errMsg}`);
        }

        toast.success("Reaction sent!");
      } catch (err) {
        toast.error("Failed to record reaction/tip");
        console.error("[reaction tip] failed", err);
      } finally {
        setReactionLoading(false);
      }
    },
    [user, hostId, spaceId, connect, address, connectors, addFloatingReaction],
  );

  return { handleSendReaction, reactionLoading };
}
