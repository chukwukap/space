import { ReactionType } from "./generated/prisma";
import { SupportedToken } from "./types";

export const USDC_DECIMALS = 6;
export const SPEND_PERMISSION_ALLOWANCE =
  process.env.NEXT_PUBLIC_PERMISSION_ALLOWANCE || "20";

/**
 * USDC contract address on the current chain (Base or Base Sepolia).
 * Provide NEXT_PUBLIC_USDC_ADDRESS env var to override.
 */
export const USDC_ADDRESS = (process.env.NEXT_PUBLIC_USDC_ADDRESS ||
  // Default to Base Sepolia USDC
  "0x9713C1cdD9b4b7bA860E5f8e0eDD3670C38AcD7C") as `0x${string}`;

export const NEXT_PUBLIC_LK_SERVER_URL: string =
  process.env.NEXT_PUBLIC_LK_SERVER_URL ?? "";

export const REACTION_EMOJIS = {
  [ReactionType.HEART]: "❤️",
  [ReactionType.CLAP]: "👏",
  [ReactionType.FIRE]: "🔥",
  [ReactionType.LAUGH]: "😂",
  [ReactionType.LIKE]: "💯",
};

// Dummy supported tokens list (replace with real data or fetch from API)
export const SUPPORTED_TOKENS: SupportedToken[] = [
  {
    address: "0x0000000000000000000000000000000000000000",
    symbol: "ETH",
    name: "Ethereum",
    iconUrl: "/tokens/eth.png",
    decimals: 18,
  },
  {
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    symbol: "USDC",
    name: "USD Coin",
    iconUrl: "/tokens/usdc.png",
    decimals: 6,
  },
  {
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    symbol: "USDT",
    name: "Tether",
    iconUrl: "/tokens/usdt.png",
    decimals: 6,
  },
];
