import { Address } from "viem";
import {
  PermissionDetails,
  SpendPermissionBatchTypedData,
  SupportedToken,
} from "./types";
import { SUPPORTED_TOKENS } from "./constants";
import { spendPermissionManagerAddress } from "./abi/SpendPermissionManager";

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
    ? Object.values(SUPPORTED_TOKENS).map((token, i) => ({
        spender: spendPermissionManagerAddress,
        token: token.address as Address,
        allowance: token.defaultAllowance,
        salt: BigInt(now + i), // for uniqueness
        extraData: "",
      }))
    : tokens.map((token, i) => ({
        spender: spendPermissionManagerAddress,
        token: token.address,
        allowance: token.defaultAllowance,
        salt: BigInt(now + i), // for uniqueness
        extraData: "",
      }));

  return {
    domain: {
      name: domainName,
      version: domainVersion,
      chainId,
      verifyingContract: spendPermissionManagerAddress,
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
      account: from,
      period: BigInt(period),
      start: BigInt(now),
      end: BigInt(now + period),
      permissions,
    },
  };
}
