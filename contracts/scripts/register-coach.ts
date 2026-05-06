import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

// ERC-8004 Identity Registry addresses
const IDENTITY_REGISTRIES: Record<number, string> = {
  42220:    "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",  // Celo Mainnet
  11142220: "0x8004A818BFB912233c491871b3d84c89A494BD9e",  // Celo Sepolia (new testnet)
};

// Minimal ABI for the register function we need
const IDENTITY_ABI = [
  {
    type: "function",
    name: "register",
    stateMutability: "nonpayable",
    inputs: [{ name: "agentURI", type: "string" }],
    outputs: [{ name: "tokenId", type: "uint256" }],
  },
  {
    type: "event",
    name: "Transfer",
    inputs: [
      { name: "from", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "tokenId", type: "uint256", indexed: true },
    ],
    anonymous: false,
  },
];

async function main() {
  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);

  if (!IDENTITY_REGISTRIES[chainId]) {
    console.log(`Network chainId ${chainId} (${network.name}) is not supported by ERC-8004 Identity Registry.`);
    console.log("Supported: Celo Mainnet (42220), Celo Sepolia (11142220).");
    console.log("If you're on Alfajores (44787), this script will skip — re-deploy on Celo Sepolia or mainnet.");
    return;
  }

  const registryAddr = IDENTITY_REGISTRIES[chainId];

  const coachKey = process.env.COACH_PRIVATE_KEY;
  if (!coachKey) throw new Error("Set COACH_PRIVATE_KEY in env");

  const coach = new ethers.Wallet(coachKey, ethers.provider);
  console.log("Network:", network.name, chainId);
  console.log("Coach wallet:", coach.address);
  console.log("Identity Registry:", registryAddr);

  const balance = await ethers.provider.getBalance(coach.address);
  console.log("Coach CELO balance:", ethers.formatEther(balance));
  if (balance < ethers.parseEther("0.01")) {
    throw new Error("Coach wallet needs ≥0.01 CELO for gas");
  }

  // Optional: agent metadata URI (can be IPFS or HTTPS). For MVP we use a placeholder.
  // Later Emanuel can update via setAgentURI to point to a real metadata file.
  const agentURI = process.env.AGENT_METADATA_URI ?? "https://pick5.app/coach-agent.json";

  console.log("\nAgent metadata URI:", agentURI);

  const registry = new ethers.Contract(registryAddr, IDENTITY_ABI, coach);

  console.log("\nRegistering on ERC-8004 Identity Registry...");
  const tx = await registry.register(agentURI);
  console.log("Tx submitted:", tx.hash);
  const receipt = await tx.wait();
  console.log("Tx confirmed in block:", receipt?.blockNumber);

  // Extract agentId from Transfer event
  const transferLog = receipt?.logs.find((log: any) => log.topics?.length === 4);
  if (transferLog) {
    const agentId = BigInt(transferLog.topics[3]);
    console.log("\n=== Registered ===");
    console.log("Agent ID:", agentId.toString());
    console.log("Owner (Coach wallet):", coach.address);
    console.log("Metadata URI:", agentURI);
    console.log("Tx hash:", tx.hash);
    console.log("\nSave this Agent ID to your env / app config:");
    console.log(`  NEXT_PUBLIC_COACH_AGENT_ID=${agentId.toString()}`);
  } else {
    console.log("WARNING: Could not parse Transfer event. Check tx manually:", tx.hash);
  }

  console.log("\n--- Self Agent ID (manual step) ---");
  console.log("Self Agent ID is registered via the Celo Agent Visa portal:");
  console.log("  1. Go to https://self.xyz or the Celo Agent Visa onboarding (linked from celopg.eco)");
  console.log("  2. Connect the Coach wallet:", coach.address);
  console.log("  3. Complete the verification flow to obtain Self Agent ID");
  console.log("  4. Save the resulting verification hash / agentSid to env");
  console.log("This step is NOT automated by this script because the Self portal is the");
  console.log("source of truth and uses an off-chain attestation flow.");
}

main().catch((e) => { console.error(e); process.exit(1); });
