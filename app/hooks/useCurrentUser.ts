import useSWR from "swr";
import { UserWithRelations } from "@/lib/types";

import { Context } from "@farcaster/frame-sdk";
import { Address } from "viem";

const fetcher = (url: string) =>
  fetch(url).then(async (res) => {
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to fetch user");
    }
    return res.json();
  });

export function useCurrentUser({
  context,
  address,
}: {
  context: Context.FrameContext | null;
  address: Address | null;
}) {
  const params = {
    fid: context?.user?.fid,
    address: address,
    username: context?.user?.username,
  };

  const hasParams = Object.values(params).some(
    (v) => v !== undefined && v !== null && v !== "",
  );

  const search = hasParams
    ? new URLSearchParams(
        Object.fromEntries(
          Object.entries(params)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => [k, String(v)]),
        ),
      ).toString()
    : null;

  const key = hasParams ? `/api/users?${search}` : null;

  const { data, error, isLoading, mutate } = useSWR<UserWithRelations | null>(
    key,
    fetcher,
    {
      revalidateOnFocus: false,
    },
  );

  return {
    user: data ?? null,
    userLoading: isLoading,
    userError: error?.message ?? null,
    refreshUser: mutate,
  };
}
