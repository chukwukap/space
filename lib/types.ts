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

export type ParticipantMetadata = {
  fid: number;
  address: string;
  displayName: string;
  username: string;
  pfpUrl: string;
  identity: number;
  clientFid: number | null;
  isHost: boolean;
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

export type TipRecipient = {
  fid: number;
  name: string;
  walletAddress: string | null;
};

export type ConnectionDetails = {
  serverUrl: string;
  roomName: string;
  participantName: string;
  participantToken: string;
};
