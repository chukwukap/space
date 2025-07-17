import useSWR from "swr";
import { User } from "@/lib/types";

const fetcher = (url: string) =>
  fetch(url).then(async (res) => {
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to fetch user");
    }
    return res.json();
  });

export function useCurrentUser(params: {
  id?: number;
  fid?: number;
  address?: string;
  username?: string;
}) {
  const hasParams = Object.values(params).some(
    (v) => v !== undefined && v !== "",
  );
  console.log("params", params);
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

  const { data, error, isLoading, mutate } = useSWR<User | null>(key, fetcher, {
    revalidateOnFocus: false,
  });

  return {
    user: data ?? null,
    userLoading: isLoading,
    userError: error?.message ?? null,
    refreshUser: mutate,
  };
}
