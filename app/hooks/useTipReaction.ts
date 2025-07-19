import { useState, useCallback } from "react";
import { getSpendPermTypedData } from "@/lib/utils";
import { SpendPermission, UserWithRelations } from "@/lib/types";
import { useSignTypedData, useConnect, useAccount } from "wagmi";
import { toast } from "sonner";
import { REACTION_EMOJIS } from "@/lib/constants";
import { ReactionType } from "@/lib/generated/prisma";

export function useTipReaction({
  user,
  hostId,
  spaceId,
  chainId,
  approveSpendPermission,
  sendData,
  addFloatingReaction,
  setLikes,
}: {
  user: UserWithRelations | null;
  hostId: string;
  spaceId: string;
  chainId: number;
  approveSpendPermission: (
    spendPermissionMessage: SpendPermission,
    signature: string,
    userId: number,
  ) => Promise<string>;
  sendData: (msg: Record<string, unknown>) => void;
  addFloatingReaction: (emoji: string) => void;
  setLikes: (fn: (c: number) => number) => void;
}) {
  const { connect, connectors } = useConnect();
  const { address } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();
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
      setLikes((c) => c + 1);
      sendData({ type: "reaction", reactionType: type });

      try {
        let addr = address;
        if (!addr) {
          connect({ connector: connectors[0] });
          addr = address;
          return;
        }

        if (!user.spendPerm) {
          const spendPerm = getSpendPermTypedData(addr, chainId);
          const signature = await signTypedDataAsync(spendPerm);

          await approveSpendPermission(
            spendPerm.message,
            signature,
            Number(user.id),
          );
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
    [
      user,
      hostId,
      spaceId,
      chainId,
      connect,
      signTypedDataAsync,
      approveSpendPermission,
      sendData,
      address,
      connectors,
      addFloatingReaction,
      setLikes,
    ],
  );

  return { handleSendReaction, reactionLoading };
}
