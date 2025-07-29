"use client";
import { createContext, useContext, ReactNode } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useAccount } from "wagmi";
import { FCContext, UserWithRelations } from "@/lib/types";
import { useCurrentUser } from "@/app/hooks/useCurrentUser";
import { useFarcasterOnboard } from "@/app/hooks/useFarcasterOnboard";
import { useWalletSync } from "@/app/hooks/useWalletSync";

/**
 * UserContextType
 * Defines the shape of the user context.
 * - user: The user object.
 * - farcasterContext: The Farcaster context.
 * - userLoading: Whether the user is loading.
 * - userError: The error message if the user fails to load.
 * - refreshUser: A function to refresh the user.
 */
interface UserContextType {
  user: UserWithRelations | null;
  farcasterContext: FCContext | null;
  userLoading: boolean;
  userError: string | null;
  refreshUser: () => Promise<void>;
}

/**
 * UserContext
 * Provides user state and actions throughout the app.
 * - user: The user object.
 * - farcasterContext: The Farcaster context.
 * - userLoading: Whether the user is loading.
 * - userError: The error message if the user fails to load.
 * - refreshUser: A function to refresh the user.
 */
const UserContext = createContext<UserContextType>({
  user: null,
  userLoading: false,
  userError: null,
  farcasterContext: null,
  refreshUser: async () => {},
});

/**
 * UserProvider
 * Manages user onboarding and state, supporting both Farcaster and wallet-only users.
 * - user: The user object.
 * - farcasterContext: The Farcaster context.
 * - userLoading: Whether the user is loading.
 * - userError: The error message if the user fails to load.
 * - refreshUser: A function to refresh the user.
 */
export function UserProvider({ children }: { children: ReactNode }) {
  const { context } = useMiniKit();
  const { address } = useAccount();

  const {
    user,
    userLoading,
    farcasterContext,
    userError,
    refreshUser: swrRefresh,
  } = useCurrentUser({
    context: context ?? null,
    address: address ?? null,
  });

  const refreshUser = async () => {
    await swrRefresh();
  };

  useFarcasterOnboard({
    user,
    farcasterContext,
    mutate: refreshUser,
  });
  useWalletSync({ user, walletAddress: address ?? null, mutate: refreshUser });

  return (
    <UserContext.Provider
      value={{
        user,
        userLoading,
        userError,
        farcasterContext,
        refreshUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

/**
 * useUser
 * Custom hook to access user context.
 * - Returns the user context.
 */
export function useUser() {
  return useContext(UserContext);
}
