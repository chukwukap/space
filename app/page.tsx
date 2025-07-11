"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, Button } from "./components/DemoComponents";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { SpaceSummary } from "@/lib/types";

export default function Landing() {
  const router = useRouter();
  // const [joinId, setJoinId] = useState("");
  const [spaces, setSpaces] = useState<SpaceSummary[]>([]);
  // Drawer-controlled form state
  const [title, setTitle] = useState("");
  const [record, setRecord] = useState(false);

  /* ----------------------------------------- */
  /* Fetch live spaces list every 5 s          */
  /* ----------------------------------------- */
  useEffect(() => {
    async function fetchSpaces() {
      try {
        // const res = await fetch("/api/spaces");
        // if (res.ok) setSpaces(await res.json());

        setSpaces([
          {
            id: "1",
            title:
              "Will Pump.fun TGE Suck Solana's Liquidity? Or it's Letsbonk Meta now?",
            listeners: 3711,
            hostName: "Wen ALTseason?",
            hostRole: "Host",
            hostBio:
              "Squad of Chads | Masters of MEMEs, Virality, Altcoins and Marketing. We've worked with 3…",
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
        ]);
      } catch {}
    }
    fetchSpaces();
    const id = setInterval(fetchSpaces, 5_000);
    return () => clearInterval(id);
  }, []);

  /* ----------------------------------------- */
  /* Handlers                                  */
  /* ----------------------------------------- */
  // const handleStart = () => {
  //   setSheetOpen(true);
  // };

  // const handleJoin = () => {
  //   if (!joinId.trim()) return;
  //   router.push(`/space/${joinId.trim()}`);
  // };

  /* ----------------------------------------- */
  /* JSX                                       */
  /* ----------------------------------------- */
  return (
    <main className="flex flex-col min-h-screen bg-black text-white pb-16 max-w-lg mx-auto relative">
      <Header />

      {/* Section heading */}
      <section className="px-6 mt-6">
        <h2 className="text-2xl font-extrabold">Happening Now</h2>
        <p className="text-sm text-gray-400 -mt-1">Spaces going on right now</p>
      </section>

      <section className="mt-6 space-y-6 px-4 flex-1 overflow-y-auto">
        {spaces.map((s) => (
          <SpaceCard
            key={s.id}
            space={s}
            onClick={() => router.push(`/space/${s.id}`)}
          />
        ))}
      </section>

      {/* Create Space Drawer */}
      <Drawer shouldScaleBackground>
        <DrawerTrigger asChild>
          <button className="absolute bottom-24 right-6 w-16 h-16 rounded-full bg-violet-600 hover:bg-violet-700 flex items-center justify-center shadow-xl">
            <Icon name="plus" className="w-7 h-7" />
          </button>
        </DrawerTrigger>

        <DrawerContent className="bg-[var(--app-background)] pb-8 px-6">
          {/* Drag handle */}
          <div className="mx-auto mt-4 h-1.5 w-10 rounded-full bg-gray-500/40" />

          <DrawerHeader className="text-center mb-4">
            <DrawerTitle>Create your Space</DrawerTitle>
          </DrawerHeader>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What do you want to talk about?"
            className="w-full px-4 py-2 rounded-lg border bg-transparent mb-4"
          />

          <label className="flex items-center gap-2 mb-6 cursor-pointer select-none text-sm">
            <input
              type="checkbox"
              checked={record}
              onChange={(e) => setRecord(e.target.checked)}
            />
            Record this Space (coming soon)
          </label>

          <Button
            className="w-full"
            onClick={() => {
              if (!title.trim()) return;
              const id = crypto.randomUUID();
              router.push(`/space/${id}?title=${encodeURIComponent(title)}`);
            }}
            disabled={!title.trim()}
          >
            Start your Space
          </Button>
        </DrawerContent>
      </Drawer>

      <nav className="absolute bottom-0 left-0 w-full bg-black border-t border-white/10 flex justify-around items-center py-2 z-10 max-w-lg mx-auto">
        <NavButton icon="star" label="Home" />
        <NavButton icon="chat" label="Search" />
        <div className="absolute -mt-8 left-1/2 -translate-x-1/2">
          <button className="bg-black border-4 border-black rounded-full p-3 shadow-lg">
            <Icon name="star" size="lg" />
          </button>
        </div>
        <NavButton icon="users" label="People" />
        <NavButton icon="share" label="Inbox" />
      </nav>
    </main>
  );
}

/* ---------------------------------------------------------------- */
/* Reusable Wallet Button                                            */
/* ---------------------------------------------------------------- */
// function WalletButton() {
//   return (
//     <Wallet className="backdrop-blur bg-white/10 rounded-full p-3 shadow-lg">
//       <ConnectWallet>
//         <Icon name="check" />
//       </ConnectWallet>
//     </Wallet>
//   );
// }

function Header() {
  return (
    <header className="flex items-center px-4 py-3 gap-3">
      <div className="w-8 h-8 rounded-full bg-gray-600" />
      <h1 className="text-2xl font-bold flex-1">Spaces</h1>
    </header>
  );
}

function SpaceCard({
  space,
  onClick,
}: {
  space: SpaceSummary;
  onClick: () => void;
}) {
  return (
    <article
      className="rounded-2xl bg-violet-600/90 hover:bg-violet-600 transition-colors p-4 space-y-4"
      onClick={onClick}
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
