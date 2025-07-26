import useSWR from "swr";
import { FCContext, UserWithRelations } from "@/lib/types";
import { Context } from "@farcaster/frame-sdk";
import { Address } from "viem";
import { useMemo } from "react";

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
  context,
  address,
}: {
  context: Context.FrameContext | null;
  address: Address | null;
}): string | null {
  // If no context and no address, return null
  if (!context?.user && !address) return null;

  // Compose params as expected by backend
  const params: Record<string, string> = {};

  // Only add if present
  if (context?.user?.fid) params.fid = String(context.user.fid);
  if (context?.user?.username) params.username = context.user.username;
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
export function useCurrentUser({
  context,
  address,
}: {
  context: Context.FrameContext | null;
  address: Address | null;
}) {
  // Memoize farcaster context for downstream consumers
  const farcasterContext: FCContext | null = useMemo(() => {
    if (!context?.user) return null;
    return {
      farcasterUser: {
        ...context.user,
        address: address ?? "",
      },
      farcasterClient: {
        clientFid: context.user.fid,
        added: context.client.added,
      },
    };
  }, [context, address]);

  // Professional mock context for fallback/testing
  const mockFarcasterContext: FCContext = {
    farcasterUser: {
      fid: 755074,
      username: "chukwukauba",
      displayName: "Chukwuka.base.eth",
      pfpUrl:
        "https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/4d0248d8-f666-4a19-65fd-3cb9acbb8100/original",
      address: "0xd584F8079192E078F0f3237622345E19360384A2",
    },
    farcasterClient: {
      clientFid: 9152,
      added: true,
    },
  };

  // Build query string as expected by backend
  const search = buildUserQuery({ context, address });

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
    farcasterContext: farcasterContext ?? mockFarcasterContext,
    userError: error?.message ?? null,
    refreshUser: mutate,
  };
}
