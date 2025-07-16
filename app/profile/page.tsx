"use client";

import Image from "next/image";
import { useUser } from "@/app/providers/userProvider";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import {
  Share2 as ShareIcon,
  Pencil as EditIcon,
  Verified as VerifiedIcon,
} from "lucide-react";
import MobileHeader from "../_components/mobileHeader";
import { ThemeToggle } from "../_components/themeToggle";

/**
 * UserProfilePage – shows public profile information.
 * --------------------------------------------------
 * Data model (coming soon):
 * • username, handle, verified, bio, location, website, joinDate
 * • avatarUrl, coverUrl
 * • stats: spacesHosted, totalEarnings, followers, following
 * • recentSpaces: Array<{ id, title, date, listeners }>
 * • badges: Array<{ id, label, icon }>
 *
 * SECURITY: No sensitive data is exposed. All wallet / private details are
 * handled server-side and never rendered directly.
 */
export default function UserProfilePage() {
  const { user } = useUser();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const miniKit = useMiniKit() as any;

  /* ------------------------------------------------------------------ */
  /* Fallback demo data – replace once API endpoints are ready           */
  /* ------------------------------------------------------------------ */
  const profile = {
    username: user?.username ?? "anon",
    handle: user?.username ? `@${user.username}` : "@anon",
    verified: true,
    bio: "Web-native audio addict. I host Spaces about crypto, community and cool tech.",
    location: "Metaverse",
    website: "https://spaces.app",
    joinDate: "Jan 2025",
    avatarUrl: user?.pfpUrl ?? "/icon.png",
    coverUrl: "/hero.png",
    stats: {
      spacesHosted: 12,
      totalEarnings: 432.5, // USDC
      followers: 891,
      following: 120,
    },
    recentSpaces: [
      {
        id: "1",
        title: "Building in Web3 – AMA",
        date: "Yesterday",
        listeners: 371,
      },
      {
        id: "2",
        title: "Token-gated Communities 101",
        date: "3 days ago",
        listeners: 184,
      },
    ],
    badges: [
      { id: "og", label: "OG Host" },
      { id: "top-earner", label: "Top Earner" },
    ],
  };

  /* ------------------------------------------------------------------ */
  /* JSX                                                                */
  /* ------------------------------------------------------------------ */
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
      {/* Cover */}
      <div className="relative w-full h-40 sm:h-56 md:h-64 overflow-hidden aurora-bg">
        <Image
          src={profile.coverUrl}
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
              src={profile.avatarUrl}
              alt={profile.username}
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
            {profile.username}
            {profile.verified && <VerifiedBadge />}
          </h2>
          <p className="text-muted-foreground">{profile.handle}</p>
        </div>

        {/* Bio & meta */}
        <p className="mt-4 whitespace-pre-wrap leading-relaxed">
          {profile.bio}
        </p>
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-4">
          <span>📍 {profile.location}</span>
          {/* Coinbase Wallet Mini App Guideline: use sdk.actions.openUrl for external links */}
          <button
            onClick={() => {
              try {
                miniKit?.actions?.openUrl?.(profile.website);
              } catch (err) {
                console.error("Failed to open external URL", err);
                // Fallback when running outside a mini app host
                if (typeof window !== "undefined") {
                  window.open(profile.website, "_blank", "noreferrer");
                }
              }
            }}
            className="hover:underline text-left"
          >
            🔗 Website
          </button>
          <span>🗓 Joined {profile.joinDate}</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <StatCard label="Spaces Hosted" value={profile.stats.spacesHosted} />
          <StatCard
            label="Earnings (USDC)"
            value={profile.stats.totalEarnings}
          />
          <StatCard label="Followers" value={profile.stats.followers} />
          <StatCard label="Following" value={profile.stats.following} />
        </div>
      </div>

      {/* Recent Spaces */}
      <section className="px-6 mb-10">
        <h3 className="text-xl font-semibold mb-4">Recent Spaces</h3>
        {profile.recentSpaces.length === 0 ? (
          <p className="text-sm text-muted-foreground">No Spaces yet.</p>
        ) : (
          <ul className="space-y-4">
            {profile.recentSpaces.map((s) => (
              <li
                key={s.id}
                className="p-4 rounded-lg glass-card glow-hover transition flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{s.title}</p>
                  <span className="text-sm text-muted-foreground">
                    {s.date} · {s.listeners} listeners
                  </span>
                </div>
                <Button variant="ghost" size="sm">
                  View
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Badges – simple pill list */}
      <section className="px-6 mb-10">
        <h3 className="text-xl font-semibold mb-4">Badges</h3>
        {profile.badges.length === 0 ? (
          <p className="text-sm text-muted-foreground">No badges yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {profile.badges.map((b) => (
              <span
                key={b.id}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm"
              >
                {b.label}
              </span>
            ))}
          </div>
        )}
      </section>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Reusable sub-components                                              */
/* ------------------------------------------------------------------ */
function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg glass-card p-4 text-center glow-hover">
      <p className="text-3xl font-extrabold leading-none text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
        <CountUp end={value} duration={1.4} separator="," />
      </p>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

function VerifiedBadge() {
  return <VerifiedIcon className="w-4 h-4 text-[#1D9BF0]" strokeWidth={2.5} />;
}
