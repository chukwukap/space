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
import { User } from "@/lib/types";

/**
 * Context type for user state management.
 */
interface UserContextType {
  user: User | null;
  userLoading: boolean;
  userError: string | null;
  refreshUser: () => Promise<void>;
}

interface UserProviderProps {
  children: ReactNode;
}

/**
 * UserContext provides user state and actions throughout the app.
 */
const UserContext = createContext<UserContextType>({
  user: null,
  userLoading: false,
  userError: null,
  refreshUser: async () => {},
});

/**
 * UserProvider manages user onboarding and state, supporting both Farcaster and wallet-only users.
 * Security: All user data is handled securely and never exposed to the client unless necessary.
 */
export function UserProvider({ children }: UserProviderProps) {
  const { context } = useMiniKit();
  const { address: walletAddress, isConnected } = useAccount();
  const [user, setUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);
  const [farcasterContextChecked, setFarcasterContextChecked] = useState(false);
  const [contextLoadingTimeout, setContextLoadingTimeout] =
    useState<NodeJS.Timeout | null>(null);

  console.log("context", JSON.stringify(context, null, 2));

  /**
   * Refresh user data from the API.
   */
  const refreshUser = async () => {
    if (!user || !user.id) return;

    setUserLoading(true);
    setUserError(null);

    try {
      const response = await fetch(`/api/users?userId=${user.id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to refresh user data");
      }
      const refreshedUser = await response.json();
      setUser(refreshedUser);
    } catch (error: unknown) {
      console.error("[UserProvider] Error refreshing user:", error);
      setUserError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setUserLoading(false);
    }
  };

  /**
   * Helper function to create or fetch a user.
   */
  const createOrFetchUser = async (payload: {
    fid?: number;
    username?: string;
    pfpUrl?: string;
    walletAddress?: string;
  }) => {
    setUserLoading(true);
    setUserError(null);

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Unknown error");
      }

      const userData = await response.json();
      setUser(userData);
    } catch (err: unknown) {
      setUserError(err instanceof Error ? err.message : "Unknown error");
      console.error("[UserProvider] User onboarding error:", err);
    } finally {
      setUserLoading(false);
    }
  };

  /**
   * Effect for Farcaster context detection and timeout management.
   */
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
      if (fid && !user && !userLoading) {
        if (!username) {
          console.error(
            "[UserProvider] WARNING: Farcaster user has fid but no extractable username!",
          );
          console.error(
            "[UserProvider] This should not happen - all Farcaster users should have usernames",
          );
          console.error("[UserProvider] Available context properties:", {
            userObj: userObj ? Object.keys(userObj) : "none",
            clientObj: clientObj ? Object.keys(clientObj) : "none",
          });
          // Don't proceed without username for Farcaster users
          setUserError(
            "Farcaster user found but username could not be extracted",
          );
          return;
        }

        // Farcaster user found - create/fetch (wallet address will be added later if needed)
        const payload = { fid, username, pfpUrl };
        createOrFetchUser(payload);
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
  }, [context, user, userLoading, farcasterContextChecked]);

  /**
   * Effect to update existing Farcaster user with wallet address when it becomes available.
   */
  useEffect(() => {
    // Only update if:
    // 1. We have a user (already created/fetched)
    // 2. User has fid (is a Farcaster user)
    // 3. User doesn't have wallet address yet
    // 4. We now have a wallet address
    if (user && user.fid && !user.walletAddress && walletAddress) {
      // Update user with wallet address via PATCH API
      fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, walletAddress }),
      })
        .then((response) => response.json())
        .then((updatedUser) => {
          setUser(updatedUser);
        })
        .catch((error) => {
          console.error(
            "[UserProvider] Error updating user with wallet:",
            error,
          );
        });
    }
  }, [user, walletAddress]);

  /**
   * Effect for wallet-only users (fallback when no Farcaster context after timeout).
   */
  useEffect(() => {
    // Only proceed if:
    // 1. Wallet is connected
    // 2. No user is currently loaded/loading
    // 3. Farcaster context has been checked (either found or timeout reached)
    if (
      !isConnected ||
      !walletAddress ||
      user ||
      userLoading ||
      !farcasterContextChecked
    ) {
      return;
    }

    // CRITICAL: Double-check if we have Farcaster context - if yes, skip wallet-only flow
    // This prevents Farcaster users from being created as wallet-only users
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

    createOrFetchUser({ walletAddress });
  }, [
    isConnected,
    walletAddress,
    user,
    userLoading,
    farcasterContextChecked,
    context,
  ]);

  return (
    <UserContext.Provider
      value={{
        user,
        userLoading,
        userError,
        refreshUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

/**
 * Custom hook to access user context.
 */
export function useUser() {
  return useContext(UserContext);
}
