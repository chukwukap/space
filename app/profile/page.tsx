"use client";

import Image from "next/image";
import { useUser } from "@/app/providers/userProvider";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Share2 as ShareIcon,
  Pencil as EditIcon,
  Users as UsersIcon,
  Gift as GiftIcon,
  Smile as ReactionIcon,
  Mic as SpaceIcon,
} from "lucide-react";
import MobileHeader from "../_components/mobileHeader";
import { ThemeToggle } from "../_components/themeToggle";
import useSWR from "swr";
import * as React from "react";

// --- Types ---
type UserProfile = {
  id: number;
  fid?: number | null;
  address: string;
  displayName?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
  createdAt: string;
  spendPerm?: unknown;
  hostedSpaces?: HostedSpace[];
  participants?: Participant[];
  tipsSent?: Tip[];
  tipsReceived?: Tip[];
  reactions?: Reaction[];
};

type HostedSpace = {
  id: number;
  title: string;
  startedAt: string;
  endedAt?: string | null;
  coverUrl?: string | null;
};

type Participant = {
  id: number;
  spaceId: number;
  joinedAt: string;
  leftAt?: string | null;
  space: HostedSpace;
};

type Tip = {
  id: number;
  amount: number;
  createdAt: string;
  toUser?: {
    id: number;
    displayName?: string | null;
    username?: string | null;
    avatarUrl?: string | null;
  };
  fromUser?: {
    id: number;
    displayName?: string | null;
    username?: string | null;
    avatarUrl?: string | null;
  };
};

type Reaction = {
  id: number;
  emoji: string;
  createdAt: string;
  space?: HostedSpace;
};

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch user profile");
    return res.json();
  });

export default function UserProfilePage() {
  const { user } = useUser();

  // Only fetch if user.id is available and a number
  const userId = typeof user?.id === "number" ? user.id : undefined;
  const {
    data: profile,
    error,
    isLoading,
  } = useSWR<UserProfile>(userId ? `/api/user?id=${userId}` : null, fetcher);

  // --- UI states ---
  if (isLoading) {
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

  if (error || !profile) {
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
          Profile not found.
        </div>
      </motion.div>
    );
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
              src={profile.avatarUrl || "/icon.png"}
              alt={profile.username || profile.displayName || "User"}
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
            {profile.displayName || profile.username || "Spacer"}
          </h2>
          {profile.username && (
            <p className="text-muted-foreground">@{profile.username}</p>
          )}
        </div>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-4">
          <span>
            🗓 Joined{" "}
            {new Date(profile.createdAt).toLocaleString("en-US", {
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* --- Profile Stats Section --- */}
      <section className="px-6 mb-8">
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
      </section>

      {/* --- Hosted Spaces --- */}
      {profile.hostedSpaces && profile.hostedSpaces.length > 0 && (
        <SectionCard
          title="Hosted Spaces"
          icon={<SpaceIcon className="w-5 h-5 text-primary" />}
        >
          <div className="flex flex-col gap-3">
            {profile.hostedSpaces.map((space) => (
              <div
                key={space.id}
                className="flex items-center gap-3 rounded-xl bg-muted/60 p-3"
              >
                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-primary/30 to-secondary/20">
                  <Image
                    src={space.coverUrl || "/hero.png"}
                    alt={space.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-base">{space.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(space.startedAt).toLocaleDateString()}{" "}
                    {space.endedAt && (
                      <span className="ml-1">
                        - Ended {new Date(space.endedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* --- Spaces Joined --- */}
      {profile.participants && profile.participants.length > 0 && (
        <SectionCard
          title="Spaces Joined"
          icon={<UsersIcon className="w-5 h-5 text-secondary" />}
        >
          <div className="flex flex-col gap-3">
            {profile.participants.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 rounded-xl bg-muted/60 p-3"
              >
                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-secondary/30 to-primary/20">
                  <Image
                    src={p.space.coverUrl || "/hero.png"}
                    alt={p.space.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-base">{p.space.title}</div>
                  <div className="text-xs text-muted-foreground">
                    Joined {new Date(p.joinedAt).toLocaleDateString()}
                    {p.leftAt && (
                      <span className="ml-1">
                        - Left {new Date(p.leftAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* --- Tips Sent --- */}
      {profile.tipsSent && profile.tipsSent.length > 0 && (
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
      )}

      {/* --- Tips Received --- */}
      {profile.tipsReceived && profile.tipsReceived.length > 0 && (
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
      )}

      {/* --- Reactions --- */}
      {profile.reactions && profile.reactions.length > 0 && (
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
      )}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Reusable sub-components                                            */
/* ------------------------------------------------------------------ */
type StatCardProps = {
  icon: React.ReactNode;
  label: string;
  value: number;
};

function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <div className="rounded-xl bg-card shadow-md flex flex-col items-center justify-center py-5 px-2">
      <div className="mb-2">{icon}</div>
      <div className="text-2xl font-extrabold font-sora">{value}</div>
      <div className="text-xs text-muted-foreground font-medium">{label}</div>
    </div>
  );
}

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
