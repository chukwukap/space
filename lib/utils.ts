import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import crypto from "crypto";
import {
  Address,
  createPublicClient,
  createWalletClient,
  Hex,
  http,
  parseUnits,
} from "viem";
import { baseSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { spendPermissionManagerAddress } from "./abi/SpendPermissionManager";
import { SpendPermission, SpendPermissionTypedData } from "./types";
import { USDC_ADDRESS } from "./constants";
import { SPEND_PERMISSION_ALLOWANCE, USDC_DECIMALS } from "./constants";

/**
 * Utility helper to combine TailwindCSS class strings intelligently.
 * Uses `clsx` for conditional classes and `tailwind-merge` to deduplicate/conflict-resolve.
 *
 * @param inputs - Variadic list of class values (strings, booleans, arrays, objects).
 * @returns Merged class string ready for the `className` prop.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generates a secure, unique username based on a prefix and random elements.
 * Ensures usernames are URL-safe and avoids ambiguous characters.
 *
 * @param prefix Optional prefix for the username (e.g., "user", "umbra", etc.)
 * @param length Number of random characters to append (default: 8)
 * @returns A generated username string
 */
export function generateUsername(
  prefix: string = "spacer_",
  length: number = 8,
): string {
  // Use a secure character set: lowercase, numbers, no ambiguous chars
  const chars = "abcdefghjkmnpqrstuvwxyz23456789"; // Excludes: i, l, o, 0, 1
  let randomPart = "";
  // Use crypto for secure random generation
  if (
    typeof window !== "undefined" &&
    window.crypto &&
    window.crypto.getRandomValues
  ) {
    // Browser environment
    const array = new Uint32Array(length);
    window.crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      randomPart += chars[array[i] % chars.length];
    }
  } else if (typeof require !== "undefined") {
    // Node.js environment
    try {
      const buf = crypto.randomBytes(length);
      for (let i = 0; i < length; i++) {
        randomPart += chars[buf[i] % chars.length];
      }
    } catch {
      // Fallback to Math.random (not cryptographically secure)
      for (let i = 0; i < length; i++) {
        randomPart += chars[Math.floor(Math.random() * chars.length)];
      }
    }
  } else {
    // Fallback to Math.random (not cryptographically secure)
    for (let i = 0; i < length; i++) {
      randomPart += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  // Compose username, all lowercase, URL-safe
  return `${prefix.toLowerCase()}_${randomPart}`;
}

export async function getPublicClient() {
  const client = createPublicClient({
    chain: baseSepolia,
    transport: http(),
  });
  return client;
}

export async function getSpenderWalletClient() {
  if (!process.env.SPENDER_PRIVATE_KEY) {
    throw new Error("SPENDER_PRIVATE_KEY env missing");
  }
  const spenderAccount = privateKeyToAccount(
    process.env.SPENDER_PRIVATE_KEY as Hex,
  );
  const spenderWallet = await createWalletClient({
    account: spenderAccount,
    chain: baseSepolia,
    transport: http(),
  });
  return spenderWallet;
}

/**
 * Generates SpendPermission typed data for USDC only.
 * All parameters are hardcoded for USDC and do not use process.env.
 *
 * @param from - The address granting permission.
 * @param _token - Ignored, always uses USDC.
 * @param _tokenDecimals - Ignored, always uses USDC decimals.
 * @param chainId - The chain ID for the domain.
 * @returns SpendPermissionTypedData object for signing.
 */
export function getSpendPermTypedData(from: Address, chainId: number) {
  // Hardcoded USDC values
  const allowance = parseUnits(SPEND_PERMISSION_ALLOWANCE, USDC_DECIMALS); // 20 USDC
  const now = Math.floor(Date.now() / 1000); // seconds since epoch
  const period = 60 * 60 * 24 * 30; // 1 month in seconds
  const end = now + period; // 1 month from now

  const spendPerm: SpendPermission = {
    account: from,
    spender: spendPermissionManagerAddress as Address,
    token: USDC_ADDRESS,
    allowance: allowance,
    period: BigInt(period),
    start: BigInt(now),
    end: BigInt(end),
    salt: BigInt(Date.now()), // Use current ms as salt
    extraData: "0x",
  } as const;

  const getSpendPermTypedDataArg: SpendPermissionTypedData = {
    domain: {
      name: "Spend Permission Manager",
      version: "1",
      chainId,
      verifyingContract: spendPermissionManagerAddress,
    },
    types: {
      SpendPermission: [
        { name: "account", type: "address" },
        { name: "spender", type: "address" },
        { name: "token", type: "address" },
        { name: "allowance", type: "uint160" },
        { name: "period", type: "uint48" },
        { name: "start", type: "uint48" },
        { name: "end", type: "uint48" },
        { name: "salt", type: "uint256" },
        { name: "extraData", type: "bytes" },
      ],
    },
    primaryType: "SpendPermission",
    message: spendPerm,
  };

  return getSpendPermTypedDataArg;
}
