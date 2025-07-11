"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ConnectWallet, Wallet } from "@coinbase/onchainkit/wallet";
import { Button, Icon } from "./components/DemoComponents";
import dynamic from "next/dynamic";
import SpaceCard from "./components/SpaceCard";
import { useFarcasterViewer } from "@/lib/farcaster";
const CreateSpaceSheet = dynamic(
  () => import("./components/CreateSpaceSheet"),
  { ssr: false },
);

export default function Landing() {
  const router = useRouter();
  const viewer = useFarcasterViewer();
  const [joinId, setJoinId] = useState("");
  const [spaces, setSpaces] = useState<
    {
      name: string;
      participants: number;
      title?: string;
      identities?: string[];
    }[]
  >([]);
  const [sheetOpen, setSheetOpen] = useState(false);

  /* ----------------------------------------- */
  /* Fetch live spaces list every 5 s          */
  /* ----------------------------------------- */
  useEffect(() => {
    async function fetchSpaces() {
      try {
        const res = await fetch("/api/spaces");
        if (res.ok) setSpaces(await res.json());
      } catch {}
    }
    fetchSpaces();
    const id = setInterval(fetchSpaces, 5_000);
    return () => clearInterval(id);
  }, []);

  /* ----------------------------------------- */
  /* Handlers                                  */
  /* ----------------------------------------- */
  const handleStart = () => {
    setSheetOpen(true);
  };

  const handleJoin = () => {
    if (!joinId.trim()) return;
    router.push(`/space/${joinId.trim()}`);
  };

  /* ----------------------------------------- */
  /* JSX                                       */
  /* ----------------------------------------- */
  return (
    <main className="min-h-screen flex flex-col items-center justify-between bg-gradient-to-tr from-purple-900 via-violet-800 to-fuchsia-900 text-white px-4 py-8">
      {/* Hero */}
      {viewer?.username && (
        <span className="absolute top-4 right-4 text-sm text-violet-200">
          Welcome, {viewer.username} 👋
        </span>
      )}
      <section className="flex flex-col items-center mt-12 mb-20 text-center max-w-xl w-full">
        <h1 className="text-5xl font-extrabold tracking-tight drop-shadow-sm">
          Spaces
        </h1>
        <p className="mt-3 text-lg text-violet-200">
          Live audio conversations for Farcaster – powered by LiveKit &amp; Base
          MiniKit.
        </p>

        {/* CTA buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button
            className="w-full sm:w-auto"
            onClick={handleStart}
            icon={<Icon name="plus" size="sm" />}
          >
            Start a Space
          </Button>
          <div className="flex gap-2 w-full sm:w-auto bg-white/10 rounded-lg px-2 py-1">
            <input
              value={joinId}
              onChange={(e) => setJoinId(e.target.value)}
              placeholder="Enter space ID..."
              className="flex-1 bg-transparent outline-none text-sm placeholder-violet-300"
            />
            <Button variant="secondary" size="sm" onClick={handleJoin}>
              Join
            </Button>
          </div>
        </div>
      </section>

      {/* Live spaces */}
      <section className="w-full max-w-xl mb-auto">
        {spaces.length > 0 && (
          <div className="backdrop-blur bg-white/10 rounded-2xl p-6 shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Live Now</h2>
            <ul className="space-y-3 max-h-72 overflow-y-auto pr-2">
              {spaces.map((s) => (
                <SpaceCard key={s.name} space={s} />
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="w-full text-center text-xs text-violet-300 mt-20">
        Built with LiveKit, Base MiniKit &amp; OnchainKit
      </footer>

      {/* Wallet connect fixed bottom right (mobile friendly) */}
      <div className="fixed bottom-6 right-6">
        <WalletButton />
      </div>
      {sheetOpen && <CreateSpaceSheet onClose={() => setSheetOpen(false)} />}
    </main>
  );
}

/* ---------------------------------------------------------------- */
/* Reusable Wallet Button                                            */
/* ---------------------------------------------------------------- */
function WalletButton() {
  return (
    <Wallet className="backdrop-blur bg-white/10 rounded-full p-3 shadow-lg">
      <ConnectWallet>
        <Icon name="check" />
      </ConnectWallet>
    </Wallet>
  );
}
