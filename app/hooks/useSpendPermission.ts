import { useCallback, useEffect, useState } from "react";
import { getSpendPermissionBatchTypedData } from "@/lib/batchSpend";
import {
  storeSpendPermission,
  fetchSpendPermissions,
} from "@/actions/spendPermission";
import {
  useAccount,
  useChainId,
  useConnect,
  useConnectors,
  useSignTypedData,
} from "wagmi";
import { Address, Hex } from "viem";
import { SpendPermissionWithSignature, SupportedToken } from "@/lib/types";

/**
 * useSpendPermission hook
 * Handles fetching, approving, and batch approving spend permissions for a user.
 *
 * @param userAddress - The user's wallet address
 * @param tokens - Array of token addresses to approve
 */
export function useSpendPermission({
  userAddress,
  fid,
  tokens,
}: {
  userAddress?: string;
  fid?: number;
  tokens?: SupportedToken[];
}) {
  const account = useAccount();
  const chainId = useChainId();
  const { connectAsync } = useConnect();
  const connectors = useConnectors();
  const { signTypedDataAsync } = useSignTypedData();

  const [permissions, setPermissions] = useState<
    SpendPermissionWithSignature[]
  >([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [approving, setApproving] = useState<boolean>(false);

  // Fetch spend permissions for the user
  const refetch = useCallback(
    async (tokens?: SupportedToken[]) => {
      if (!userAddress) return;
      setLoading(true);
      setError(null);
      try {
        // Assume userAddress is a wallet address, need to fetch userFid from backend if needed
        // For now, treat userAddress as fid if it's a number, else skip
        if (!fid) {
          setPermissions([]);
          setLoading(false);
          return;
        }
        const perms = await fetchSpendPermissions(fid, tokens);
        setPermissions(perms);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch spend permissions",
        );
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    },
    [userAddress, fid],
  );

  useEffect(() => {
    refetch();
  }, [userAddress, fid, refetch, tokens]);

  /**
   * Approve spend permission for a single token (not batch).
   * Not implemented in this batch-focused hook, but stub provided for interface compatibility.
   */
  const approve = useCallback(async () => {
    // This hook is batch-focused; single approve can be implemented as needed.
    throw new Error("Single token approve not implemented in batch hook.");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Approve spend permissions for all tokens in batch.
   */
  const batchApprove = useCallback(
    async (tokens: SupportedToken[]) => {
      setApproving(true);
      setError(null);
      try {
        let addr: Address | undefined = account.address as Address | undefined;
        if (!addr) {
          // Connect wallet if not connected
          const res = await connectAsync({ connector: connectors[0] });
          addr = res.accounts[0] as Address;
        }
        if (!addr) throw new Error("Wallet address not found");
        // Generate batch typed data for all tokens
        const typedData = getSpendPermissionBatchTypedData(
          addr,
          chainId,
          tokens,
        );

        // Sign the typed data
        const signature: Hex = await signTypedDataAsync({
          domain: typedData.domain,
          types: typedData.types,
          primaryType: typedData.primaryType,
          message: { ...typedData.message } as Record<string, unknown>,
        });

        if (!fid) throw new Error("User FID not found for batch approval");

        // Store the batch spend permission onchain and in DB
        await storeSpendPermission(
          typedData.message,
          signature,
          fid,
          true, // isBatch
        );

        await refetch(tokens);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to batch approve spend permissions",
        );
      } finally {
        setApproving(false);
      }
    },
    [
      account.address,
      chainId,
      connectAsync,
      connectors,
      signTypedDataAsync,
      fid,
      refetch,
    ],
  );

  return {
    permissions,
    loading,
    error,
    approve,
    batchApprove,
    refetch,
    approving,
  };
}
