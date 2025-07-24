import { Address } from "viem";
import { Prisma, ReactionType } from "@/lib/generated/prisma";

export type UserWithRelations = Prisma.UserGetPayload<{
  include: {
    tipsSent: true;
    tipsReceived: true;
    tippingPreferences: true;
  };
}>;

export type TipPreference = {
  amounts: {
    [key in ReactionType]: number;
  };
  token: string;
  chainId: number;
  allowance: bigint;
};

export type SpaceWithHostParticipant = Prisma.SpaceGetPayload<{
  include: {
    participants: {
      where: { role: "HOST" };
      include: { user: true };
    };
    host: true;
  };
}>;

export type ParticipantMetadata = {
  fid: number;
  address: string;
  displayName: string;
  username: string;
  pfpUrl: string;
  identity: number;
  clientFid: number | null;
  isHost: boolean | null;
  handRaised?: boolean; // Indicates if participant has raised their hand
};

export interface SpaceMetadata {
  clientFid: number | null;
  title: string;
  host: ParticipantMetadata;
  recording: boolean;
  ended: boolean;
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

export interface PermissionDetails {
  spender: Address;
  token: Address;
  allowance: bigint;
  salt: bigint;
  extraData: string;
}

export interface SpendPermissionBatch {
  account: Address;
  period: bigint;
  start: bigint;
  end: bigint;
  permissions: PermissionDetails[];
}

export interface SpendPermissionBatchTypedData {
  domain: {
    name: string;
    version: string;
    chainId: number;
    verifyingContract: Address;
  };
  types: {
    PermissionDetails: { name: string; type: string }[];
    SpendPermissionBatch: { name: string; type: string }[];
  };
  primaryType: "SpendPermissionBatch";
  message: SpendPermissionBatch;
}

export type SpendPermissionWithSignature = {
  spendPermissionMessage: SpendPermission;
  signature: string;
  txHash: string;
};

export type TipRecipient = {
  fid: number;
  name: string;
  walletAddress: string | null;
};

export type Tip = {
  id: number;
  amount: number;
  createdAt: string;
  toUser?: {
    id: number;
    displayName?: string | null;
    username?: string | null;
    avatarUrl?: string | null;
  };
  fromUser?: {
    id: number;
    displayName?: string | null;
    username?: string | null;
    avatarUrl?: string | null;
  };
};

export type Reaction = {
  id: number;
  emoji: string;
  createdAt: string;
  // space?: HostedSpace;
};

export type SupportedToken = {
  address: Address;
  symbol: string;
  name: string;
  defaultPeriod: bigint;
  defaultStart: bigint;
  defaultEnd: bigint;
  iconUrl: string;
  decimals: number;
  defaultAllowance: bigint;
};
export type ConnectionDetails = {
  serverUrl: string;
  roomName: string;
  participantName: string;
  participantToken: string;
};
