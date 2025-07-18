import { Address } from "viem";

export interface User {
  id: string;
  fid?: number;
  username?: string;
  walletAddress?: string;
  pfpUrl?: string;
  /**
   * JSON stringified spend permission data (message, signature, txHash) if the
   * user has already signed/approved a spend permission. Undefined otherwise.
   */
  spendPerm?: string;
}

export interface SpaceMetadata {
  title: string;
  hostFid: string;
  hostId: string;
  hostAddress: string;
  recording: boolean;
  ended: boolean;
}

export interface ParticipantMetadata {
  isHost: boolean;
  pfpUrl: string | null;
  fid: number | null;
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
