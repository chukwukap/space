import { parseUnits } from "viem/utils";
import { Address, getAddress } from "viem";
import {
  PermissionDetails,
  SpendPermissionBatchTypedData,
  SupportedToken,
} from "./types";

const TOKENS: Record<string, SupportedToken> = {
  USDC: {
    symbol: "USDC",
    address: "0x...", // your USDC address
    decimals: 6,
    allowance: "20",
    name: "USD Coin",
    iconUrl: "/tokens/usdc.png",
  },
  SPAY: {
    symbol: "SPAY",
    address: "0x...", // your SPAY address
    decimals: 18,
    allowance: "250",
    name: "Sonic Pay",
    iconUrl: "/tokens/spay.png",
  },
} as const;

const spendPermissionManagerAddress = "0x..."; // actual contract address
const domainName = "Spend Permission Manager";
const domainVersion = "1";

export function getSpendPermissionBatchTypedData(
  from: Address,
  chainId: number,
  tokens?: SupportedToken[],
): SpendPermissionBatchTypedData {
  const now = Math.floor(Date.now() / 1000);
  const period = 60 * 60 * 24 * 30; // 30 days

  const permissions: PermissionDetails[] = !tokens
    ? Object.values(TOKENS).map((token, i) => ({
        spender: getAddress(spendPermissionManagerAddress),
        token: getAddress(token.address),
        allowance: parseUnits(token.allowance, token.decimals),
        salt: BigInt(now + i), // for uniqueness
        extraData: "0x",
      }))
    : tokens.map((token, i) => ({
        spender: getAddress(spendPermissionManagerAddress),
        token: getAddress(token.address),
        allowance: parseUnits(token.allowance, token.decimals),
        salt: BigInt(now + i), // for uniqueness
        extraData: "0x",
      }));

  return {
    domain: {
      name: domainName,
      version: domainVersion,
      chainId,
      verifyingContract: getAddress(spendPermissionManagerAddress),
    },
    types: {
      PermissionDetails: [
        { name: "spender", type: "address" },
        { name: "token", type: "address" },
        { name: "allowance", type: "uint160" },
        { name: "salt", type: "uint256" },
        { name: "extraData", type: "bytes" },
      ],
      SpendPermissionBatch: [
        { name: "account", type: "address" },
        { name: "period", type: "uint48" },
        { name: "start", type: "uint48" },
        { name: "end", type: "uint48" },
        { name: "permissions", type: "PermissionDetails[]" },
      ],
    },
    primaryType: "SpendPermissionBatch",
    message: {
      account: getAddress(from),
      period: BigInt(period),
      start: BigInt(now),
      end: BigInt(now + period),
      permissions,
    },
  };
}
