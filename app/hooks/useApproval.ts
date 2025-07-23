import { useCallback, useEffect, useState } from "react";
import { ERC20_ABI } from "@/lib/abi/ERC20";
import {
  useAccount,
  usePublicClient,
  useWalletClient,
  useConnect,
} from "wagmi";
import type { Address, Hex } from "viem";

// Types for clarity and safety
type UseApprovalOptions = {
  tokenAddress: Address;
  spender: Address;
};

type ApprovalStatus =
  | "unknown"
  | "approved"
  | "not_approved"
  | "pending"
  | "error"
  | "connect_wallet"; // Add a new status for wallet connection prompt

interface UseApprovalResult {
  isApproved: boolean;
  status: ApprovalStatus;
  allowance: bigint | null;
  loading: boolean;
  error: string | null;
  approve: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * useApproval
 * Handles ERC20 token approval logic for Sonic Space.
 * - Checks allowance
 * - Initiates approval
 * - Tracks status
 * - Uses wagmi viem wrapper for all onchain calls
 * - Prompts user to connect wallet if not connected, and calls connect immediately
 */
export function useApproval({
  tokenAddress,
  spender,
}: UseApprovalOptions): UseApprovalResult {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { connect, connectors } = useConnect();

  const [allowance, setAllowance] = useState<bigint | null>(null);
  const [status, setStatus] = useState<ApprovalStatus>("unknown");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper: connect wallet if not connected
  const connectWallet = useCallback(() => {
    if (connectors && connectors.length > 0) {
      // Use the first available connector for simplicity
      connect({ connector: connectors[0] });
    }
  }, [connect, connectors]);

  // Helper: fetch current allowance
  const fetchAllowance = useCallback(async () => {
    console.log("Fetching allowance", address, tokenAddress, spender);

    if (!address) {
      setAllowance(null);
      setStatus("connect_wallet");
      setError("Please connect your wallet to continue.");
      connectWallet();
      return;
    }
    if (!tokenAddress || !spender || !publicClient) {
      setAllowance(null);
      setStatus("unknown");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [address, spender],
      });
      console.log("Allowance read result::", result);
      setAllowance(result);
      setStatus(
        result >= (allowance ?? BigInt(0)) ? "approved" : "not_approved",
      );
    } catch {
      setError("Failed to fetch allowance");
      setStatus("error");
      setAllowance(null);
    } finally {
      setLoading(false);
    }
  }, [address, tokenAddress, spender, allowance, publicClient, connectWallet]);

  // Approve function
  const approve = useCallback(async () => {
    if (!address) {
      setError("Please connect your wallet to approve.");
      setStatus("connect_wallet");
      connectWallet();
      return;
    }
    if (!walletClient || !tokenAddress || !spender) {
      setError("Wallet not connected or missing parameters");
      setStatus("connect_wallet");
      connectWallet();
      return;
    }
    if (!publicClient) {
      setError("No public client available");
      return;
    }
    setLoading(true);
    setStatus("pending");
    setError(null);
    try {
      console.log("Approving", tokenAddress, spender, allowance);
      // Approve the exact amount requested (could use MaxUint256 for infinite approval if desired)
      if (!allowance) {
        setError("No allowance found");
        setStatus("error");
        return;
      }
      const txHash = await walletClient.writeContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [spender, allowance],
        account: address,
      });
      // Wait for tx confirmation
      await publicClient.waitForTransactionReceipt({ hash: txHash as Hex });
      // Refresh allowance after approval
      await fetchAllowance();
    } catch (err) {
      // Try to extract a user-friendly error message
      let msg = "Approval transaction failed. Please try again.";
      if (typeof err === "object" && err !== null) {
        if (err instanceof Error) {
          msg = err.message;
        }
      }
      setError(msg);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  }, [
    walletClient,
    address,
    tokenAddress,
    spender,
    allowance,
    publicClient,
    fetchAllowance,
    connectWallet,
  ]);

  // Refresh function for manual reload
  const refresh = useCallback(async () => {
    await fetchAllowance();
  }, [fetchAllowance]);

  // Auto-fetch allowance on mount and when dependencies change
  useEffect(() => {
    fetchAllowance();
  }, [address, tokenAddress, spender, allowance, publicClient, fetchAllowance]);

  return {
    isApproved: status === "approved",
    status,
    allowance,
    loading,
    error,
    approve,
    refresh,
  };
}
