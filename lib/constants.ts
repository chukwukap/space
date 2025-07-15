export const USDC_DECIMALS = 6;

/**
 * USDC contract address on the current chain (Base or Base Sepolia).
 * Provide NEXT_PUBLIC_USDC_ADDRESS env var to override.
 */
export const USDC_ADDRESS = (process.env.NEXT_PUBLIC_USDC_ADDRESS ||
  // Default to Base Sepolia USDC
  "0x9713C1cdD9b4b7bA860E5f8e0eDD3670C38AcD7C") as `0x${string}`;
