"use client";
import { createContext, useContext, ReactNode } from "react";
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
export function UserProvider({ children }: { children: ReactNode }) {
  const { context } = useMiniKit();
  const { address: walletAddress } = useAccount();

  const {
    user,
    userLoading,
    userError,
    refreshUser: swrRefresh,
  } = useCurrentUser({
    fid: context?.user?.fid ?? undefined,
    address: walletAddress ?? undefined,
  });

  const refreshUser = async () => {
    await swrRefresh();
  };

  useFarcasterOnboard({ context, user, mutate: refreshUser });
  useWalletSync({ user, walletAddress, mutate: refreshUser });

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
