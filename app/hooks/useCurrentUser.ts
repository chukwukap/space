import useSWR from "swr";
import { ParticipantMetadata, UserWithRelations } from "@/lib/types";

import { Context } from "@farcaster/frame-sdk";
import { Address } from "viem";
import { getMockParticipant } from "@/lib/mockParticipants";

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
  const participantMetadata: ParticipantMetadata | null = {
    fid: context?.user?.fid ?? 0,
    address: address ?? "",
    displayName: context?.user?.username ?? "",
    username: context?.user?.username ?? "",
    identity: context?.user?.fid ?? 0,
    pfpUrl: context?.user?.pfpUrl ?? "",
    clientFid: context?.user?.fid ?? 0,
    isHost: false,
  };

  // Allow ?mock=<id> override for local dev
  let mockParticipantMetadata: ParticipantMetadata | null = null;
  if (typeof window !== "undefined") {
    const mockId = new URLSearchParams(window.location.search).get("mock");
    if (mockId) mockParticipantMetadata = getMockParticipant(mockId);
  }

  const hasParams = mockParticipantMetadata
    ? Object.values(mockParticipantMetadata).some(
        (v) => v !== undefined && v !== null && v !== "",
      )
    : false;

  const search =
    mockParticipantMetadata && hasParams
      ? new URLSearchParams(
          Object.fromEntries(
            Object.entries(mockParticipantMetadata)
              .filter(([, v]) => v !== undefined && v !== null)
              .map(([k, v]) => [k, String(v)]),
          ),
        ).toString()
      : null;

  const key = search ? `/api/users?${search}` : null;

  const { data, error, isLoading, mutate } = useSWR<UserWithRelations | null>(
    key,
    fetcher,
    {
      revalidateOnFocus: false,
    },
  );

  // Professional mock user for testing, based on schema and provided data
  // const mockUser: UserWithRelations = {
  //   id: 1,
  //   fid: 755074,
  //   address: "0xd584F8079192E078F0f3237622345E19360384A2",
  //   displayName: "Chukwuka.base.eth",
  //   username: "chukwukauba",
  //   avatarUrl:
  //     "https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/4d0248d8-f666-4a19-65fd-3cb9acbb8100/original",
  //   createdAt: new Date("2025-07-19T18:57:31Z"),
  //   farcasterClientIdOnboardedFrom: 9152,
  //   spendPerm: {},
  //   tipsSent: [],
  //   tipsReceived: [],
  // };

  return {
    user: data ?? null,
    userLoading: isLoading,
    userMetadata: mockParticipantMetadata ?? participantMetadata,
    userError: error?.message ?? null,
    refreshUser: mutate,
  };
}
