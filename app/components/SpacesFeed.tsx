"use client";

import { Icon } from "./DemoComponents";

interface SpaceSummary {
  id: string;
  title: string;
  listeners: number;
  hostName: string;
  hostRole: string;
  hostBio: string;
  avatars: string[]; // up to two avatars
}

// Fake data for layout
const SPACES: SpaceSummary[] = [
  {
    id: "1",
    title:
      "Will Pump.fun TGE Suck Solana's Liquidity? Or it's Letsbonk Meta now?",
    listeners: 3711,
    hostName: "Wen ALTseason?",
    hostRole: "Host",
    hostBio:
      "Squad of Chads | Masters of MEMEs, Virality, Altcoins and Marketing. We’ve worked with 3…",
    avatars: ["/public/icon.png", "/public/hero.png"],
  },
  {
    id: "2",
    title: "Indias biggest Mass hero 🔥",
    listeners: 1073,
    hostName: "Lohith Reddy🦋🍷",
    hostRole: "Host",
    hostBio: "Gangster! Founder of LR Media",
    avatars: ["/public/icon.png", "/public/logo.png"],
  },
];

export default function SpacesFeed() {
  return (
    <div className="flex flex-col min-h-screen bg-black text-white pb-16">
      <Header />

      {/* Section heading */}
      <section className="px-6 mt-6">
        <h2 className="text-2xl font-extrabold">Happening Now</h2>
        <p className="text-sm text-gray-400 -mt-1">Spaces going on right now</p>
      </section>

      {/* Live space cards */}
      <section className="mt-6 space-y-6 px-4 flex-1 overflow-y-auto">
        {SPACES.map((s) => (
          <SpaceCard key={s.id} space={s} />
        ))}
      </section>

      {/* Floating “create” button */}
      <button
        className="fixed bottom-24 right-6 w-16 h-16 rounded-full bg-violet-600 hover:bg-violet-700 flex items-center justify-center shadow-xl"
        // TODO: open create sheet
      >
        <Icon name="plus" className="w-7 h-7" />
      </button>

      <BottomNav />
    </div>
  );
}

function Header() {
  return (
    <header className="flex items-center px-4 py-3 gap-3">
      <div className="w-8 h-8 rounded-full bg-gray-600" />
      <h1 className="text-2xl font-bold flex-1">Spaces</h1>
    </header>
  );
}

function SpaceCard({ space }: { space: SpaceSummary }) {
  return (
    <article
      className="rounded-2xl bg-violet-600/90 hover:bg-violet-600 transition-colors p-4 space-y-4"
      // TODO: onClick navigate to room
    >
      <div className="flex items-center gap-2 text-xs uppercase font-semibold">
        <Icon name="mic" className="text-white/70" />
        LIVE
      </div>

      <h3 className="text-xl font-bold leading-snug">{space.title}</h3>

      <div className="flex items-center gap-2 text-sm">
        <div className="flex -space-x-2">
          {space.avatars.map((src, i) => (
            <div
              key={i}
              className="w-7 h-7 rounded-full bg-violet-400 border-2 border-violet-600 overflow-hidden"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="pfp" className="object-cover w-full h-full" />
            </div>
          ))}
        </div>
        <span>{space.listeners} listening</span>
      </div>

      {/* Host row */}
      <div className="flex items-center gap-2 text-sm pt-2 border-t border-white/20">
        <span className="w-6 h-6 rounded-full bg-yellow-500 inline-block" />
        <span className="font-semibold">{space.hostName}</span>
        <span className="bg-white/20 rounded px-2 py-0.5 text-[10px] uppercase tracking-wide">
          {space.hostRole}
        </span>
      </div>
      <p className="text-xs text-white/80 line-clamp-2">{space.hostBio}</p>
    </article>
  );
}

function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 w-full bg-black border-t border-white/10 flex justify-around items-center py-2 z-50">
      <NavButton icon="star" label="Home" />
      <NavButton icon="chat" label="Search" />
      <div className="relative -mt-8">
        <button className="bg-black border-4 border-black rounded-full p-3 shadow-lg">
          <Icon name="star" size="lg" />
        </button>
      </div>
      <NavButton icon="users" label="People" />
      <NavButton icon="share" label="Inbox" />
    </nav>
  );
}

function NavButton({
  icon,
  label,
}: {
  icon: Parameters<typeof Icon>[0]["name"];
  label: string;
}) {
  return (
    <button className="flex flex-col items-center text-white/80 hover:text-white">
      <Icon name={icon} />
      <span className="text-[10px] mt-0.5">{label}</span>
    </button>
  );
}
