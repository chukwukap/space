import { createPublicClient, createWalletClient, Hex, http } from "viem";
import { baseSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
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
