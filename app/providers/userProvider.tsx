"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useAccount } from "wagmi";
import { Participant } from "@/lib/types";

interface ParticipantContextType {
  participant: Participant | null;
  participantLoading: boolean;
  participantError: string | null;
  refreshParticipant: () => Promise<void>;
}

interface ParticipantProviderProps {
  children: ReactNode;
}

const ParticipantContext = createContext<ParticipantContextType>({
  participant: null,
  participantLoading: false,
  participantError: null,
  refreshParticipant: async () => {},
});

export function ParticipantProvider({ children }: ParticipantProviderProps) {
  const { context } = useMiniKit();
  const { address: walletAddress, isConnected } = useAccount();
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [participantLoading, setParticipantLoading] = useState(false);
  const [participantError, setParticipantError] = useState<string | null>(null);
  const [farcasterContextChecked, setFarcasterContextChecked] = useState(false);
  const [contextLoadingTimeout, setContextLoadingTimeout] =
    useState<NodeJS.Timeout | null>(null);

  // Function to refresh participant data (fetch fresh data from API)
  const refreshParticipant = async () => {
    if (!participant || !participant.id) return;

    setParticipantLoading(true);
    setParticipantError(null);

    try {
      const response = await fetch(`/api/users?userId=${participant.id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to refresh participant data");
      }
      const refreshedParticipant = await response.json();
      setParticipant(refreshedParticipant);
    } catch (error: unknown) {
      console.error(
        "[ParticipantProvider] Error refreshing participant:",
        error,
      );
      setParticipantError(
        error instanceof Error ? error.message : "Unknown error",
      );
    } finally {
      setParticipantLoading(false);
    }
  };

  // Helper function to create or fetch participant
  const createOrFetchParticipant = async (payload: unknown) => {
    setParticipantLoading(true);
    setParticipantError(null);

    try {
      const response = await fetch("/api/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Unknown error");
      }

      const participantData = await response.json();
      setParticipant(participantData);
    } catch (err: unknown) {
      setParticipantError(err instanceof Error ? err.message : "Unknown error");
      console.error("[ParticipantProvider] Participant onboarding error:", err);
    } finally {
      setParticipantLoading(false);
    }
  };

  // Effect for Farcaster context detection and timeout management
  useEffect(() => {
    // Clear any existing timeout
    if (contextLoadingTimeout) {
      clearTimeout(contextLoadingTimeout);
      setContextLoadingTimeout(null);
    }

    if (context) {
      // Context is available - mark as checked immediately
      if (!farcasterContextChecked) {
        setFarcasterContextChecked(true);
      }

      const userObj = context.user;
      const clientObj = context.client;

      // Cast to any to access Farcaster-specific properties not in OnchainKit types
      const fid =
        (userObj && (userObj as unknown as { fid: number }).fid) ||
        (clientObj &&
          ((clientObj as unknown as { fid: number }).fid ||
            (clientObj as unknown as { clientFid: number }).clientFid));

      // Prioritize actual Farcaster username over display name
      const username =
        (userObj && (userObj as unknown as { username: string }).username) || // First try actual username
        (clientObj &&
          (clientObj as unknown as { username: string }).username) ||
        (userObj &&
          (userObj as unknown as { displayName: string }).displayName) || // Then display name
        (clientObj &&
          (clientObj as unknown as { displayName: string }).displayName) ||
        (userObj && (userObj as unknown as { name: string }).name) || // Finally name
        (clientObj && (clientObj as unknown as { name: string }).name);

      const pfpUrl =
        (userObj && (userObj as unknown as { pfpUrl: string }).pfpUrl) ||
        (clientObj && (clientObj as unknown as { pfpUrl: string }).pfpUrl) ||
        "";

      // CRITICAL: If we have an fid, this is ALWAYS a Farcaster user, regardless of username extraction
      if (fid && !participant && !participantLoading) {
        if (!username) {
          console.error(
            "[ParticipantProvider] WARNING: Farcaster participant has fid but no extractable username!",
          );
          console.error(
            "[ParticipantProvider] This should not happen - all Farcaster participants should have usernames",
          );
          console.error("[ParticipantProvider] Available context properties:", {
            userObj: userObj ? Object.keys(userObj) : "none",
            clientObj: clientObj ? Object.keys(clientObj) : "none",
          });
          // Don't proceed without username for Farcaster users
          setParticipantError(
            "Farcaster participant found but username could not be extracted",
          );
          return;
        }

        // Farcaster user found - create/fetch (wallet address will be added later if needed)
        const payload = { fid, username, pfpUrl };
        createOrFetchParticipant(payload);
      }
    } else {
      // Context is null - set a timeout to wait for it to potentially load
      if (!farcasterContextChecked) {
        const timeout = setTimeout(() => {
          setFarcasterContextChecked(true);
        }, 2000); // Wait 2 seconds for Farcaster context to load

        setContextLoadingTimeout(timeout);
      }
    }

    // Cleanup timeout on unmount
    return () => {
      if (contextLoadingTimeout) {
        clearTimeout(contextLoadingTimeout);
      }
    };
  }, [context, participant, participantLoading, farcasterContextChecked]);

  // Separate effect to update existing Farcaster user with wallet address when it becomes available
  useEffect(() => {
    // Only update if:
    // 1. We have a user (already created/fetched)
    // 2. User has fid (is a Farcaster user)
    // 3. User doesn't have wallet address yet
    // 4. We now have a wallet address
    if (
      participant &&
      participant.fid &&
      !participant.walletAddress &&
      walletAddress
    ) {
      // Update user with wallet address via PATCH API
      fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: participant.id, walletAddress }),
      })
        .then((response) => response.json())
        .then((updatedUser) => {
          setParticipant(updatedUser);
        })
        .catch((error) => {
          console.error(
            "[ParticipantProvider] Error updating participant with wallet:",
            error,
          );
        });
    }
  }, [participant, walletAddress]);

  // Effect for wallet-only participants (fallback when no Farcaster context after timeout)
  useEffect(() => {
    // Only proceed if:
    // 1. Wallet is connected
    // 2. No participant is currently loaded/loading
    // 3. Farcaster context has been checked (either found or timeout reached)
    if (
      !isConnected ||
      !walletAddress ||
      participant ||
      participantLoading ||
      !farcasterContextChecked
    ) {
      return;
    }

    // CRITICAL: Double-check if we have Farcaster context - if yes, skip wallet-only flow
    // This prevents Farcaster participants from being created as wallet-only participants
    const hasFarcasterContext =
      context &&
      ((context.user && (context.user as unknown as { fid: number }).fid) ||
        (context.client &&
          ((context.client as unknown as { fid: number }).fid ||
            (context.client as unknown as { clientFid: number }).clientFid)));

    if (hasFarcasterContext) {
      return;
    }

    // Double-check: if context exists but no fid, still skip wallet-only flow
    // This handles edge cases where context exists but fid extraction failed
    if (context) {
      return;
    }

    createOrFetchParticipant({ walletAddress });
  }, [
    isConnected,
    walletAddress,
    participant,
    participantLoading,
    farcasterContextChecked,
    context,
  ]);

  return (
    <ParticipantContext.Provider
      value={{
        participant,
        participantLoading,
        participantError,
        refreshParticipant,
      }}
    >
      {children}
    </ParticipantContext.Provider>
  );
}

export function useParticipant() {
  return useContext(ParticipantContext);
}
