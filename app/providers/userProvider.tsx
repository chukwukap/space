"use client";
import React, { createContext, useContext, ReactNode } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useAccount } from "wagmi";
import { User } from "@/lib/types";
import { useCurrentUser } from "@/app/hooks/useCurrentUser";
import { useFarcasterOnboard } from "@/app/hooks/useFarcasterOnboard";
import { useWalletSync } from "@/app/hooks/useWalletSync";

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
  const { address: walletAddress } = useAccount();

  // ---------------- Extract identifiers ----------------
  // Farcaster fid (if any)
  const userObj = context?.user as unknown as { fid?: number } | undefined;
  const clientObj = context?.client as unknown as {
    fid?: number;
    clientFid?: number;
  } | null;

  const fid = userObj?.fid ?? clientObj?.fid ?? clientObj?.clientFid;

  // ---------------- SWR fetch ----------------
  const {
    user,
    userLoading,
    userError,
    refreshUser: swrRefresh,
  } = useCurrentUser({
    fid,
    address: walletAddress ?? undefined,
  });

  const refreshUser = async () => {
    await swrRefresh();
  };

  // ---------------- Side-effects ----------------
  useFarcasterOnboard({ context, user, mutate: swrRefresh });
  useWalletSync({ user, walletAddress, mutate: swrRefresh });

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
