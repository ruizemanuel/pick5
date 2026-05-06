export type Network = "alfajores" | "celo" | "celo-sepolia";

export const ADDRESSES = {
  alfajores: {
    pick5Pool:  process.env.NEXT_PUBLIC_PICK5_POOL_ALFAJORES ?? "",
    coachAgent: process.env.NEXT_PUBLIC_COACH_AGENT_ALFAJORES ?? "",
    usdt:       process.env.NEXT_PUBLIC_USDT_ALFAJORES ?? "",
  },
  celo: {
    pick5Pool:  process.env.NEXT_PUBLIC_PICK5_POOL_CELO ?? "",
    coachAgent: process.env.NEXT_PUBLIC_COACH_AGENT_CELO ?? "",
    usdt:       "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e",
  },
  "celo-sepolia": {
    pick5Pool:  process.env.NEXT_PUBLIC_PICK5_POOL_SEPOLIA ?? "",
    coachAgent: process.env.NEXT_PUBLIC_COACH_AGENT_SEPOLIA ?? "",
    usdt:       process.env.NEXT_PUBLIC_USDT_SEPOLIA ?? "",
  },
} as const;

export const DEFAULT_NETWORK: Network =
  (process.env.NEXT_PUBLIC_NETWORK as Network) ?? "alfajores";

export function poolAddress(network: Network = DEFAULT_NETWORK): `0x${string}` {
  return (ADDRESSES[network].pick5Pool || "0x0000000000000000000000000000000000000000") as `0x${string}`;
}

export function coachAddress(network: Network = DEFAULT_NETWORK): `0x${string}` {
  return (ADDRESSES[network].coachAgent || "0x0000000000000000000000000000000000000000") as `0x${string}`;
}

export function usdtAddress(network: Network = DEFAULT_NETWORK): `0x${string}` {
  return (ADDRESSES[network].usdt || "0x0000000000000000000000000000000000000000") as `0x${string}`;
}
