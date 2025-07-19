import { useState, useCallback } from "react";
import { Address } from "viem";
import { getSpendPermTypedData } from "@/lib/utils";
import {
  SpaceWithHostParticipant,
  User,
  SpendPermission,
  SpendPermissionTypedData,
} from "@/lib/types";

export function useTipReaction({
  user,
  space,
  address,
  chainId,
  connect,
  signTypedDataAsync,
  approveSpendPermission,
  sendData,
  toast,
  reactionEmojis,
  addFloatingReaction,
  setLikes,
}: {
  user: User;
  space: SpaceWithHostParticipant;
  address: Address | undefined;
  chainId: number;
  connect: () => Promise<{ accounts: readonly Address[] }>;
  signTypedDataAsync: (data: SpendPermissionTypedData) => Promise<string>;
  approveSpendPermission: (
    spendPermissionMessage: SpendPermission,
    signature: string,
    userId: number,
  ) => Promise<string>;
  sendData: (msg: Record<string, unknown>) => void;
  toast?: { success: (msg: string) => void; error: (msg: string) => void };
  reactionEmojis: Record<string, string>;
  addFloatingReaction: (emoji: string) => void;
  setLikes: (fn: (c: number) => number) => void;
}) {
  const [reactionLoading, setReactionLoading] = useState(false);

  const handleSendReaction = useCallback(
    async (type: string) => {
      if (!user) {
        toast?.error("User not found");
        return;
      }
      setReactionLoading(true);
      // optimistic display
      addFloatingReaction(reactionEmojis[type]);
      setLikes((c) => c + 1);
      sendData({ type: "reaction", reactionType: type });
      try {
        let addr = address;
        if (!addr) {
          const res = await connect();
          addr = res.accounts[0];
        }
        if (!addr) return;
        const spendPerm = getSpendPermTypedData(addr, chainId);
        const signature = await signTypedDataAsync(spendPerm);
        await approveSpendPermission(
          spendPerm.message,
          signature,
          parseInt(user.id),
        );
        await fetch("/api/reactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            spaceId: space.id,
            userId: user.id,
            type,
          }),
        });
        toast?.success("Reaction sent!");
      } catch (err) {
        toast?.error("Failed to record reaction/tip");
        console.error("[reaction tip] failed", err);
      } finally {
        setReactionLoading(false);
      }
    },
    [
      user,
      space,
      address,
      chainId,
      connect,
      signTypedDataAsync,
      approveSpendPermission,
      sendData,
      toast,
      reactionEmojis,
      addFloatingReaction,
      setLikes,
    ],
  );

  return { handleSendReaction, reactionLoading };
}
