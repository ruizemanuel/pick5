// QA prep multi-user: mint mockUSDT to N wallets, send CELO gas to wallets that
// look like fresh ones (low CELO balance), seed the pool. No bot join — caller
// joins via UI from each wallet.
//
// Set TEST_POOL, TEST_USDT, USER_WALLETS (comma-separated) in env.

import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const POOL = process.env.TEST_POOL!;
  const USDT = process.env.TEST_USDT!;
  const USERS = (process.env.USER_WALLETS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!POOL || !USDT || USERS.length === 0) {
    throw new Error("Set TEST_POOL, TEST_USDT, USER_WALLETS (comma-separated)");
  }

  const deployer = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY!, ethers.provider);
  console.log("Deployer:", deployer.address);
  console.log("POOL    :", POOL);
  console.log("USDT    :", USDT);
  console.log("Users   :", USERS.join(", "));

  const usdt = await ethers.getContractAt("MockUSDT", USDT, deployer);
  const pool = await ethers.getContractAt("Pick5Pool", POOL, deployer);

  console.log("\n[1/3] Minting 100 USDT deployer + 50 USDT each user...");
  await (await usdt.mint(deployer.address, 100_000_000n)).wait();
  for (const u of USERS) {
    await (await usdt.mint(u, 50_000_000n)).wait();
    console.log(`       ${u} → ${(Number(await usdt.balanceOf(u)) / 1e6).toFixed(2)} USDT`);

    const celoBal = await ethers.provider.getBalance(u);
    if (celoBal < ethers.parseEther("0.05")) {
      console.log(`       ${u} has low CELO (${ethers.formatEther(celoBal)}), sending 0.1 CELO`);
      const tx = await deployer.sendTransaction({ to: u, value: ethers.parseEther("0.1") });
      await tx.wait();
    }
  }

  console.log("\n[2/3] Seeding pool with 10 USDT...");
  await (await usdt.approve(POOL, 10_000_000n)).wait();
  await (await pool.seedPool(10_000_000n)).wait();
  console.log("       seedAmount:", (Number(await pool.seedAmount()) / 1e6).toFixed(2));

  console.log("\n[3/3] Final state:");
  console.log("       lockTime:", new Date(Number(await pool.lockTime()) * 1000).toISOString());
  console.log("       endTime :", new Date(Number(await pool.endTime()) * 1000).toISOString());
  console.log("       now     :", new Date().toISOString());
  console.log("\n✅ Both users can now join via UI.");
}

main().catch((e) => { console.error(e); process.exit(1); });
