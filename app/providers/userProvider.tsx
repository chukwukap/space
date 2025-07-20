"use client";
import { createContext, useContext, ReactNode } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useAccount } from "wagmi";
import { ParticipantMetadata, UserWithRelations } from "@/lib/types";
import { useCurrentUser } from "@/app/hooks/useCurrentUser";
import { useFarcasterOnboard } from "@/app/hooks/useFarcasterOnboard";
import { useWalletSync } from "@/app/hooks/useWalletSync";

/**
 * Context type for user state management.
 */
interface UserContextType {
  user: UserWithRelations | null;
  userLoading: boolean;
  userError: string | null;
  userMetadata: ParticipantMetadata | null;
  refreshUser: () => Promise<void>;
}

/**
 * UserContext provides user state and actions throughout the app.
 */
const UserContext = createContext<UserContextType>({
  user: null,
  userLoading: false,
  userError: null,
  userMetadata: null,
  refreshUser: async () => {},
});

/**
 * UserProvider manages user onboarding and state, supporting both Farcaster and wallet-only users.
 * Security: All user data is handled securely and never exposed to the client unless necessary.
 */
export function UserProvider({ children }: { children: ReactNode }) {
  const { context } = useMiniKit();
  const { address } = useAccount();

  const {
    user,
    userLoading,
    userMetadata,
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
    context,
    user,
    userMetadata,
    mutate: refreshUser,
  });
  useWalletSync({ user, walletAddress: address ?? null, mutate: refreshUser });

  return (
    <UserContext.Provider
      value={{
        user,
        userLoading,
        userError,
        userMetadata,
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
