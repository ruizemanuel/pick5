import { celo, celoAlfajores, celoSepolia } from "viem/chains";
import type { Network } from "./addresses";

/**
 * The viem Chain for a given Pick5 network. Single source for server-side
 * createPublicClient/createWalletClient chain selection (every route used to
 * inline its own copy of this map).
 */
export function chainForNetwork(network: Network) {
  if (network === "celo") return celo;
  if (network === "celo-sepolia") return celoSepolia;
  return celoAlfajores;
}
