import { createConfig, http } from "wagmi";
import { celo, celoAlfajores, celoSepolia } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "";

export const config = createConfig({
  chains: [celo, celoAlfajores, celoSepolia],
  connectors: [
    injected({ shimDisconnect: true }),
    ...(projectId ? [walletConnect({ projectId })] : []),
  ],
  transports: {
    [celo.id]: http(),
    [celoAlfajores.id]: http(),
    [celoSepolia.id]: http(),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
