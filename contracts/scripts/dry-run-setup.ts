// Dry-run helper: mint mock USDT to deployer + oracle wallets, seed pool,
// then have both wallets join the tournament. Run this BEFORE lockTime.

import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

const POOL = "0x183b521f345d53e1AC297CC3e0A2111284d7E742";
const USDT = "0xCdCDC0AA586aD4ecb3B6fd02D9B7757ECa0888D5";

async function main() {
  const deployer = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY!, ethers.provider);
  const oracle   = new ethers.Wallet(process.env.ORACLE_PRIVATE_KEY!,   ethers.provider);
  console.log("Deployer:", deployer.address);
  console.log("Oracle (also playing as user2):", oracle.address);

  const usdt = await ethers.getContractAt("MockUSDT", USDT, deployer);
  const pool = await ethers.getContractAt("Pick5Pool", POOL, deployer);

  console.log("\n[1/5] Minting 100 mock USDT to deployer + 5 to oracle...");
  await (await usdt.mint(deployer.address, 100_000_000n)).wait();
  await (await usdt.mint(oracle.address,    5_000_000n)).wait();
  console.log("       mint ok");

  console.log("\n[2/5] Deployer seeding pool with 10 USDT...");
  await (await usdt.approve(POOL, 10_000_000n)).wait();
  await (await pool.seedPool(10_000_000n)).wait();
  console.log("       seedAmount=", (await pool.seedAmount()).toString());

  console.log("\n[3/5] Deployer joining with lineup [1,2,3,4,5]...");
  await (await usdt.approve(POOL, 5_000_000n)).wait();
  await (await pool.joinTournament([1, 2, 3, 4, 5])).wait();
  console.log("       hasJoined(deployer)=", await pool.hasJoined(deployer.address));

  console.log("\n[4/5] Oracle wallet joining with lineup [10,20,30,40,50] as user2...");
  const usdtAsOracle = usdt.connect(oracle);
  const poolAsOracle = pool.connect(oracle);
  await (await usdtAsOracle.approve(POOL, 5_000_000n)).wait();
  await (await poolAsOracle.joinTournament([10, 20, 30, 40, 50])).wait();
  console.log("       hasJoined(oracle)=", await pool.hasJoined(oracle.address));

  console.log("\n[5/5] Final state:");
  console.log("       participantsLength:", (await pool.participantsLength()).toString());
  console.log("       lockTime:", (await pool.lockTime()).toString());
  console.log("       endTime: ", (await pool.endTime()).toString());
  console.log("       now:     ", Math.floor(Date.now() / 1000).toString());
  console.log("\nNext step: run dry-run-finish.ts AFTER endTime.");
}

main().catch((e) => { console.error(e); process.exit(1); });
