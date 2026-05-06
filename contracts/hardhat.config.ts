import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY ?? "0x" + "1".repeat(64);
const CELOSCAN_API_KEY = process.env.CELOSCAN_API_KEY ?? "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      viaIR: true,
    },
  },
  networks: {
    hardhat: {
      forking: {
        url: "https://forno.celo.org",
        blockNumber: undefined,
      },
      chainId: 31337,
    },
    alfajores: {
      url: "https://alfajores-forno.celo-testnet.org",
      accounts: [PRIVATE_KEY],
      chainId: 44787,
    },
    celo: {
      url: "https://forno.celo.org",
      accounts: [PRIVATE_KEY],
      chainId: 42220,
    },
  },
  etherscan: {
    apiKey: { celo: CELOSCAN_API_KEY, alfajores: CELOSCAN_API_KEY },
    customChains: [
      {
        network: "celo",
        chainId: 42220,
        urls: { apiURL: "https://api.celoscan.io/api", browserURL: "https://celoscan.io" },
      },
      {
        network: "alfajores",
        chainId: 44787,
        urls: { apiURL: "https://api-alfajores.celoscan.io/api", browserURL: "https://alfajores.celoscan.io" },
      },
    ],
  },
  gasReporter: { enabled: true },
  typechain: { outDir: "typechain-types", target: "ethers-v6" },
};

export default config;
