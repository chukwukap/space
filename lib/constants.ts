import { ReactionType } from "./generated/prisma";
import { SupportedToken } from "./types";
import { Address, parseUnits } from "viem";

export const NEXT_PUBLIC_LK_SERVER_URL: string =
  process.env.NEXT_PUBLIC_LK_SERVER_URL ?? "";

export const REACTION_EMOJIS = {
  [ReactionType.HEART]: "❤️",
  [ReactionType.CLAP]: "👏",
  [ReactionType.FIRE]: "🔥",
  [ReactionType.LAUGH]: "😂",
  [ReactionType.LIKE]: "💯",
};

export const ETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
export const USDC_ADDRESS_BASE = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";
export const TSPACE_ADDRESS =
  process.env.NEXT_PUBLIC_TSPACE_ADDRESS ??
  "0x0000000000000000000000000000000000000000";

// Helper to get current unix timestamp in seconds
const now = () => Math.floor(Date.now() / 1000);

export const SUPPORTED_TOKENS: SupportedToken[] = [
  {
    address: ETH_ADDRESS,
    symbol: "ETH",
    name: "Ethereum",
    iconUrl: "/tokens/eth.png",
    decimals: 18,
    // Spend permission defaults: 1 day period, valid from now, for 1 year, 20 ETH allowance
    defaultPeriod: BigInt(24 * 60 * 60), // 1 day in seconds
    defaultStart: BigInt(now()), // Start now
    defaultEnd: BigInt(now() + 31_536_000), // 1 year from now
    defaultAllowance: parseUnits("0.1", 18), // 0.1 ETH per day
  },
  {
    address: USDC_ADDRESS_BASE,
    symbol: "USDC",
    name: "USD Coin",
    iconUrl: "/tokens/usdc.png",
    decimals: 6,
    // Spend permission defaults: 1 day period, valid from now, for 1 year, 20,000 USDC allowance
    defaultPeriod: BigInt(24 * 60 * 60),
    defaultStart: BigInt(now()),
    defaultEnd: BigInt(now() + 31_536_000),
    defaultAllowance: parseUnits("20000", 6),
  },
  {
    address: TSPACE_ADDRESS as Address,
    symbol: "TSPACE",
    name: "Tip Space",
    iconUrl: "/tokens/tspace.png",
    decimals: 6,
    // Spend permission defaults: 1 day period, valid from now, for 1 year, 20,000 USDT allowance
    defaultPeriod: BigInt(24 * 60 * 60),
    defaultStart: BigInt(now()),
    defaultEnd: BigInt(now() + 31_536_000),
    defaultAllowance: parseUnits("20000", 6),
  },
];
