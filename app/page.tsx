"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from "@coinbase/onchainkit/wallet";
import {
  Name,
  Identity,
  Address,
  Avatar,
  EthBalance,
} from "@coinbase/onchainkit/identity";
import { Button, Icon } from "./components/DemoComponents";

export default function Landing() {
  const router = useRouter();
  const [joinId, setJoinId] = useState("");

  const handleStart = () => {
    const roomId = crypto.randomUUID();
    router.push(`/room/${roomId}`);
  };

  const handleJoin = () => {
    if (joinId.trim()) {
      router.push(`/room/${joinId.trim()}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[var(--app-background)] to-[var(--app-gray)] text-[var(--app-foreground)] p-6">
      {/* Top Wallet Connect */}
      <div className="absolute top-4 right-4">
        <Wallet>
          <ConnectWallet>
            <Name />
          </ConnectWallet>
          <WalletDropdown>
            <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
              <Avatar />
              <Name />
              <Address />
              <EthBalance />
            </Identity>
            <WalletDropdownDisconnect />
          </WalletDropdown>
        </Wallet>
      </div>

      <h1 className="text-4xl font-bold mb-2">Spaces</h1>
      <p className="text-[var(--app-foreground-muted)] mb-8 text-center max-w-md">
        Spin up live audio rooms on Farcaster – powered by LiveKit & Base
        MiniKit.
      </p>

      <div className="flex flex-col gap-4 w-full max-w-sm">
        <Button onClick={handleStart} icon={<Icon name="plus" size="sm" />}>
          Start a Space
        </Button>

        <div className="flex gap-2">
          <input
            value={joinId}
            onChange={(e) => setJoinId(e.target.value)}
            placeholder="Enter room ID..."
            className="flex-1 px-3 py-2 bg-[var(--app-card-bg)] border border-[var(--app-card-border)] rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--app-accent)]"
          />
          <Button variant="secondary" onClick={handleJoin}>
            Join
          </Button>
        </div>
      </div>

      <footer className="mt-8 text-xs text-[var(--app-foreground-muted)]">
        Built with LiveKit, Base MiniKit & OnchainKit
      </footer>
    </div>
  );
}
