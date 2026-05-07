// Fund a personal wallet on Celo Sepolia for browser testing.
// Sends 0.1 CELO (gas) + mints 50 mock USDT.
//
// Usage:
//   $env:MY_WALLET = "0xYOUR_PERSONAL_METAMASK_ADDRESS"
//   pnpm --filter @pick5/contracts hardhat run scripts/fund-my-wallet.ts --network celo-sepolia

import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

// Mock USDT deployed in the live Sepolia tournament (chainId 11142220).
// If you re-deploy, update this to the new MockUSDT address.
const MOCK_USDT = "0x30Fd86a732E1fb0f3f24bd4DFEce762ed13645c1";

async function main() {
  const target = process.env.MY_WALLET;
  if (!target || !ethers.isAddress(target)) {
    throw new Error(
      "Set MY_WALLET to a valid 0x address before running.\n" +
      'Example (PowerShell): $env:MY_WALLET = "0xYour..."'
    );
  }

  const deployer = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY!, ethers.provider);
  const network = await ethers.provider.getNetwork();
  console.log("Network:", network.name, network.chainId.toString());
  console.log("Deployer:", deployer.address);
  console.log("Target  :", target);

  // 1. Send 0.1 CELO for gas (skipped if target IS the deployer)
  if (target.toLowerCase() === deployer.address.toLowerCase()) {
    console.log("\n[1/2] Target is the deployer wallet → skipping CELO transfer.");
  } else {
    const celoBefore = await ethers.provider.getBalance(target);
    console.log("\n[1/2] Sending 0.1 CELO for gas...");
    const tx1 = await deployer.sendTransaction({
      to: target,
      value: ethers.parseEther("0.1"),
    });
    await tx1.wait();
    const celoAfter = await ethers.provider.getBalance(target);
    console.log(
      "       balance:",
      ethers.formatEther(celoBefore),
      "→",
      ethers.formatEther(celoAfter),
      "CELO"
    );
  }

  // 2. Mint 50 mock USDT
  console.log("\n[2/2] Minting 50 mock USDT...");
  const usdt = await ethers.getContractAt("MockUSDT", MOCK_USDT, deployer);
  const usdtBefore = (await usdt.balanceOf(target)) as bigint;
  const tx2 = await usdt.mint(target, 50_000_000n); // 50 USDT (6 decimals)
  await tx2.wait();
  const usdtAfter = (await usdt.balanceOf(target)) as bigint;
  console.log(
    "       balance:",
    (Number(usdtBefore) / 1e6).toFixed(2),
    "→",
    (Number(usdtAfter) / 1e6).toFixed(2),
    "USDT"
  );

  console.log("\n✅ Wallet funded.");
  console.log("\nNext steps in the browser:");
  console.log("  1. Open https://pick5-beta.vercel.app/play/build");
  console.log("  2. Connect your wallet → make sure it's on Celo Sepolia (chainId 11142220).");
  console.log("     If MetaMask doesn't have Celo Sepolia, add it manually:");
  console.log("       RPC: https://forno.celo-sepolia.celo-testnet.org");
  console.log("       Chain ID: 11142220");
  console.log("       Symbol: CELO");
  console.log("  3. Pick 5 players and click Continue → Approve → Submit.");
  console.log("  4. The lineup is locked at 2026-05-16T14:00:00Z (real tournament dates).");
}

main().catch((e) => { console.error(e); process.exit(1); });
