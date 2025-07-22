"use client";

import Image from "next/image";
import { useUser } from "@/app/providers/userProvider";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Share2 as ShareIcon, Pencil as EditIcon } from "lucide-react";
import MobileHeader from "../_components/mobileHeader";
import { ThemeToggle } from "../_components/themeToggle";
import * as React from "react";
import { useSpendPermission } from "@/app/hooks/useSpendPermission"; // Custom hook for spend permissions
import { SUPPORTED_TOKENS } from "@/lib/constants";
import { SupportedToken } from "@/lib/types";

export default function UserProfilePage() {
  const { user } = useUser();
  const {
    permissions,
    loading: spendLoading,
    error: spendError,
    approve: approveSingle,
    batchApprove,
    refetch: refetchSpend,
  } = useSpendPermission({
    userAddress: user?.address ?? undefined,
    tokens: SUPPORTED_TOKENS,
  });

  // UI state for selected tokens for batch approval
  const [selectedTokens, setSelectedTokens] = React.useState<SupportedToken[]>(
    [],
  );

  // Handle select/deselect token for batch approval
  const handleTokenToggle = (token: SupportedToken) => {
    setSelectedTokens((prev) =>
      prev.includes(token) ? prev.filter((t) => t !== token) : [...prev, token],
    );
  };

  // Handle batch approve
  const handleBatchApprove = async (tokens: SupportedToken[]) => {
    if (tokens.length === 0) return;
    await batchApprove(tokens);
    setSelectedTokens([]);
    refetchSpend(tokens);
  };

  // --- UI states ---
  if (spendLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex flex-col min-h-screen bg-background text-foreground items-center justify-center"
      >
        <MobileHeader
          title="Profile"
          showBack={true}
          right={<ThemeToggle />}
          lowerVisible={false}
        />
        <div className="mt-32 text-lg text-muted-foreground">
          Loading profile…
        </div>
      </motion.div>
    );
  }

  if (spendError) {
    console.error(spendError);
  }

  // --- Main Profile UI ---
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="flex flex-col min-h-screen bg-background text-foreground"
    >
      <MobileHeader
        title="Profile"
        showBack={true}
        right={<ThemeToggle />}
        lowerVisible={false}
      />

      {/* Cover (placeholder, as coverUrl is not in schema) */}
      <div className="relative w-full h-40 sm:h-56 md:h-64 overflow-hidden aurora-bg">
        <Image
          src={"/hero.png"}
          alt="cover"
          fill
          priority
          className="object-cover"
        />
      </div>

      {/* Avatar & header actions */}
      <div className="relative flex flex-col px-6 -mt-14 sm:-mt-20 md:-mt-24 mb-6">
        <div className="flex items-end justify-between w-full">
          <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 border-background overflow-hidden">
            <Image
              src={user?.avatarUrl || "/me.jpg"}
              alt={user?.username || user?.displayName || "User"}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="icon" aria-label="Share profile">
              <ShareIcon className="w-5 h-5" />
            </Button>
            <Button variant="outline" className="gap-1">
              <EditIcon className="w-4 h-4" /> Edit profile
            </Button>
          </div>
        </div>

        {/* Name & handle */}
        <div className="mt-4">
          <h2 className="text-2xl font-bold flex items-center gap-1">
            {user?.displayName || user?.username || "Spacer"}
          </h2>
          {user?.username && (
            <p className="text-muted-foreground">@{user.username}</p>
          )}
        </div>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-4">
          <span>
            🗓 Joined{" "}
            {user?.createdAt
              ? new Date(user.createdAt).toLocaleString("en-US", {
                  month: "short",
                  year: "numeric",
                })
              : "--"}
          </span>
        </div>
      </div>

      {/* --- Spend Permission Section --- */}
      <SectionCard title="Approve Spend Permissions" icon={<></>}>
        <div className="flex flex-col gap-2">
          {spendError && (
            <div className="text-red-500 text-sm mb-2">
              {typeof spendError === "string"
                ? spendError
                : "Failed to load spend permissions."}
            </div>
          )}
          {SUPPORTED_TOKENS.map((token) => {
            // Find the permission object for this token
            const permission = permissions?.find(
              (p) => p.spendPermissionMessage.token === token.address,
            );
            // txHash is string | undefined. If it's defined, it's approved.
            const isApproved = !!permission?.txHash;
            const isLoading = spendLoading;
            return (
              <div
                key={token.address}
                className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <Image
                    src={token.iconUrl}
                    alt={token.symbol}
                    width={32}
                    height={32}
                    className="rounded-full border border-muted"
                  />
                  <div>
                    <div className="font-semibold text-base font-sora">
                      {token.symbol}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {token.name}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="accent-blue-500 w-5 h-5"
                    checked={selectedTokens.includes(token)}
                    onChange={() => handleTokenToggle(token)}
                    aria-label={`Select ${token.symbol} for batch approval`}
                  />
                  <Button
                    size="sm"
                    variant={isApproved ? "secondary" : "default"}
                    // The approve button should only be disabled if already approved or loading, not based on the checkbox
                    disabled={isApproved || isLoading}
                    onClick={async () => {
                      await approveSingle(token);
                      refetchSpend([token]);
                    }}
                  >
                    {isApproved
                      ? "Approved"
                      : isLoading
                        ? "Approving..."
                        : "Approve"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-end mt-3">
          <Button
            size="sm"
            variant="default"
            // The batch approve button is enabled only if at least one token is selected and not loading
            disabled={selectedTokens.length === 0 || spendLoading}
            onClick={() => handleBatchApprove(selectedTokens)}
          >
            {spendLoading ? "Approving..." : "Approve Selected"}
          </Button>
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          Approving spend permissions lets Sonic Space send tokens on your
          behalf for tips and rewards. You can revoke at any time in your
          wallet.
        </div>
      </SectionCard>

      {/* --- Profile Stats Section --- */}
      {/* <section className="px-6 mb-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            icon={<SpaceIcon className="w-6 h-6 text-primary" />}
            label="Spaces Hosted"
            value={profile.hostedSpaces?.length ?? 0}
          />
          <StatCard
            icon={<UsersIcon className="w-6 h-6 text-secondary" />}
            label="Spaces Joined"
            value={profile.participants?.length ?? 0}
          />
          <StatCard
            icon={<GiftIcon className="w-6 h-6 text-pink-500" />}
            label="Tips Sent"
            value={profile.tipsSent?.length ?? 0}
          />
          <StatCard
            icon={<GiftIcon className="w-6 h-6 text-green-500" />}
            label="Tips Received"
            value={profile.tipsReceived?.length ?? 0}
          />
        </div>
      </section> */}

      {/* --- Tips Sent --- */}
      {/* {profile.tipsSent && profile.tipsSent.length > 0 && (
        <SectionCard
          title="Tips Sent"
          icon={<GiftIcon className="w-5 h-5 text-pink-500" />}
        >
          <div className="flex flex-col gap-3">
            {profile.tipsSent.map((tip) => (
              <div
                key={tip.id}
                className="flex items-center gap-3 rounded-xl bg-muted/60 p-3"
              >
                <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-pink-400">
                  <Image
                    src={tip.toUser?.avatarUrl || "/icon.png"}
                    alt={
                      tip.toUser?.username || tip.toUser?.displayName || "User"
                    }
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-base">
                    {tip.toUser?.displayName || tip.toUser?.username || "User"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {tip.toUser?.username && <>@{tip.toUser.username} · </>}
                    {new Date(tip.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="font-bold text-pink-500 text-lg">
                  +{tip.amount}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )} */}

      {/* --- Tips Received --- */}
      {/* {profile.tipsReceived && profile.tipsReceived.length > 0 && (
        <SectionCard
          title="Tips Received"
          icon={<GiftIcon className="w-5 h-5 text-green-500" />}
        >
          <div className="flex flex-col gap-3">
            {profile.tipsReceived.map((tip) => (
              <div
                key={tip.id}
                className="flex items-center gap-3 rounded-xl bg-muted/60 p-3"
              >
                <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-green-400">
                  <Image
                    src={tip.fromUser?.avatarUrl || "/icon.png"}
                    alt={
                      tip.fromUser?.username ||
                      tip.fromUser?.displayName ||
                      "User"
                    }
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-base">
                    {tip.fromUser?.displayName ||
                      tip.fromUser?.username ||
                      "User"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {tip.fromUser?.username && <>@{tip.fromUser.username} · </>}
                    {new Date(tip.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="font-bold text-green-500 text-lg">
                  +{tip.amount}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )} */}

      {/* --- Reactions --- */}
      {/* {profile.reactions && profile.reactions.length > 0 && (
        <SectionCard
          title="Reactions"
          icon={<ReactionIcon className="w-5 h-5 text-yellow-500" />}
        >
          <div className="flex flex-col gap-3">
            {profile.reactions.map((reaction) => (
              <div
                key={reaction.id}
                className="flex items-center gap-3 rounded-xl bg-muted/60 p-3"
              >
                <span className="text-2xl">{reaction.emoji}</span>
                <div className="flex-1">
                  <div className="font-semibold text-base">
                    {reaction.space?.title || "Space"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(reaction.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )} */}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Reusable sub-components                                            */
/* ------------------------------------------------------------------ */
// type StatCardProps = {
//   icon: React.ReactNode;
//   label: string;
//   value: number;
// };

// function StatCard({ icon, label, value }: StatCardProps) {
//   return (
//     <div className="rounded-xl bg-card shadow-md flex flex-col items-center justify-center py-5 px-2">
//       <div className="mb-2">{icon}</div>
//       <div className="text-2xl font-extrabold font-sora">{value}</div>
//       <div className="text-xs text-muted-foreground font-medium">{label}</div>
//     </div>
//   );
// }

type SectionCardProps = {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
};

function SectionCard({ title, icon, children }: SectionCardProps) {
  return (
    <section className="mb-8 px-6">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="text-lg font-bold font-sora">{title}</h3>
      </div>
      <div>{children}</div>
    </section>
  );
}
