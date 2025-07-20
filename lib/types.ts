import { Address } from "viem";
import { Prisma } from "@/lib/generated/prisma";

export type UserWithRelations = Prisma.UserGetPayload<{
  include: { tipsSent: true; tipsReceived: true };
}>;

export type SpaceWithHostParticipant = Prisma.SpaceGetPayload<{
  include: {
    participants: {
      where: { role: "HOST" };
      include: { user: true };
    };
    host: true;
  };
}>;

export interface SpaceMetadata {
  title: string;
  hostFid: string;
  hostId: string;
  hostAddress: string;
  recording: boolean;
  ended: boolean;
}

export interface ParticipantMetadata {
  userDbId: number | null;
  pfpUrl: string | null;
  fid: number | null;
  walletAddress: string | null;
  handRaised: boolean;
}

export interface SpendPermission {
  account: Address;
  spender: Address;
  token: Address;
  allowance: bigint;
  period: bigint;
  start: bigint;
  end: bigint;
  salt: bigint;
  extraData: string;
  [key: string]: unknown;
}

export interface SpendPermissionTypedData {
  domain: {
    name: string;
    version: string;
    chainId: number;
    verifyingContract: Address;
  };
  types: {
    SpendPermission: {
      name: string;
      type: string;
    }[];
  };
  primaryType: "SpendPermission";
  message: SpendPermission;
}

export type TipRecipient = {
  id: number;
  name: string;
  walletAddress: string;
};
