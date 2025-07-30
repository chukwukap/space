import useSWR from "swr";
import { UserWithRelations } from "@/lib/types";
import { Address } from "viem";

/**
 * Fetcher for SWR that throws on error and returns JSON.
 */
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to fetch user");
  }
  return res.json();
};

/**
 * Helper to build query string for /api/users endpoint.
 * Only includes id, fid, address, username as expected by backend.
 */
function buildUserQuery({
  address,
}: {
  address: Address | null;
}): string | null {
  // If no context and no address, return null
  if (!address) return null;

  // Compose params as expected by backend
  const params: Record<string, string> = {};

  // Only add if present
  if (address) params.address = address;

  // If no params, return null
  if (Object.keys(params).length === 0) return null;

  return new URLSearchParams(params).toString();
}

/**
 * React hook to fetch the current user from the backend.
 * Sends only the expected query params: id, fid, address, username.
 * Falls back to a professional mock user if no context is available.
 */
export function useCurrentUser({ address }: { address: Address | null }) {
  // Build query string as expected by backend
  const search = buildUserQuery({
    address: address ?? null,
  });

  // Only call API if we have at least one valid param
  const key = search ? `/api/users?${search}` : null;

  const {
    error,
    isLoading,
    mutate,
    data: userWithRelations,
  } = useSWR<UserWithRelations | null>(key, fetcher, {
    revalidateOnFocus: false,
  });

  return {
    user: userWithRelations ?? null,
    userLoading: isLoading,
    userError: error?.message ?? null,
    refreshUser: mutate,
  };
}
