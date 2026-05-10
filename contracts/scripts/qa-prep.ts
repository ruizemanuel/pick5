// QA prep: mint mockUSDT to user wallet, seed pool with 10 USDT, join bot lineup.
// Set TEST_POOL, TEST_USDT, USER_WALLET in env.

import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const POOL = process.env.TEST_POOL!;
  const USDT = process.env.TEST_USDT!;
  const USER = process.env.USER_WALLET!;
  if (!POOL || !USDT || !USER) {
    throw new Error("Set TEST_POOL, TEST_USDT, USER_WALLET in env.");
  }

  const deployer = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY!, ethers.provider);
  console.log("Deployer:", deployer.address);
  console.log("User    :", USER);
  console.log("POOL    :", POOL);
  console.log("USDT    :", USDT);

  const usdt = await ethers.getContractAt("MockUSDT", USDT, deployer);
  const pool = await ethers.getContractAt("Pick5Pool", POOL, deployer);

  console.log("\n[1/4] Minting 100 USDT to deployer + 50 USDT to user wallet...");
  await (await usdt.mint(deployer.address, 100_000_000n)).wait();
  await (await usdt.mint(USER, 50_000_000n)).wait();
  console.log("       deployer:", (Number(await usdt.balanceOf(deployer.address)) / 1e6).toFixed(2));
  console.log("       user    :", (Number(await usdt.balanceOf(USER)) / 1e6).toFixed(2));

  console.log("\n[2/4] Seeding pool with 10 USDT...");
  await (await usdt.approve(POOL, 10_000_000n)).wait();
  await (await pool.seedPool(10_000_000n)).wait();
  console.log("       seedAmount:", (Number(await pool.seedAmount()) / 1e6).toFixed(2));

  console.log("\n[3/4] Bot wallet (deployer) joining with lineup [1,2,3,4,5]...");
  await (await usdt.approve(POOL, 5_000_000n)).wait();
  await (await pool.joinTournament([1, 2, 3, 4, 5])).wait();
  console.log("       hasJoined(deployer):", await pool.hasJoined(deployer.address));

  console.log("\n[4/4] Final state:");
  console.log("       participantsLength:", (await pool.participantsLength()).toString());
  console.log("       lockTime          :", new Date(Number(await pool.lockTime()) * 1000).toISOString());
  console.log("       endTime           :", new Date(Number(await pool.endTime()) * 1000).toISOString());
  console.log("       now               :", new Date().toISOString());

  console.log("\n✅ Ready for user to join via UI.");
}

main().catch((e) => { console.error(e); process.exit(1); });
