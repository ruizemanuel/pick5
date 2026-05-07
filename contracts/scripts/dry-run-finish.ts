// Dry-run finalizer: simulate yield, submit scores, finalize, claim, withdraw.
// Run this AFTER the test deploy's endTime has passed.

import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import crypto from "node:crypto";

dotenv.config();

const POOL  = "0x183b521f345d53e1AC297CC3e0A2111284d7E742";
const USDT  = "0xCdCDC0AA586aD4ecb3B6fd02D9B7757ECa0888D5";
const AAVE  = "0xbbFe810893d3d0184A44303014F983E5A28958f4";
const AUSDT = "0xb623fF325bBAc01344583d5118A5D3def6Fc50C6";

async function main() {
  const deployer = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY!, ethers.provider);
  const oracle   = new ethers.Wallet(process.env.ORACLE_PRIVATE_KEY!,   ethers.provider);

  const pool = await ethers.getContractAt("Pick5Pool", POOL, deployer);
  const usdt = await ethers.getContractAt("MockUSDT", USDT, deployer);
  const aUsdt = await ethers.getContractAt("MockAUsdt", AUSDT, deployer);

  const now = Math.floor(Date.now() / 1000);
  const endTime = Number(await pool.endTime());
  console.log("now:", now, "endTime:", endTime, "delta:", now - endTime);
  if (now < endTime) {
    throw new Error(`Tournament not ended yet. Wait ${endTime - now}s more.`);
  }

  console.log("\n[1/6] Simulating 0.5 USDT yield (mint aUSDT to pool + USDT to MockAavePool)...");
  await (await aUsdt.mint(POOL, 500_000n)).wait();
  await (await usdt.mint(AAVE, 500_000n)).wait();
  console.log("       yield simulated");

  console.log("\n[2/6] Oracle submitting scores: deployer=50, oracle=100 (oracle wins)...");
  const seed = "0x" + crypto.randomBytes(32).toString("hex");
  const poolAsOracle = pool.connect(oracle);
  const tx = await poolAsOracle.submitScores(
    [deployer.address, oracle.address],
    [50, 100],
    seed
  );
  await tx.wait();
  console.log("       winner:", await pool.winner());
  console.log("       winningScore:", (await pool.winningScore()).toString());
  console.log("       scoresSubmitted:", await pool.scoresSubmitted());

  console.log("\n[3/6] Anyone calling finalizeAndDistribute...");
  await (await pool.finalizeAndDistribute()).wait();
  const prize = await pool.prizeAmount();
  console.log("       prizeAmount:", prize.toString(), "(expected ~10.5e6 = 10 seed + 0.5 yield)");

  console.log("\n[4/6] Winner (oracle) claiming prize...");
  const oracleUsdtBefore = await usdt.balanceOf(oracle.address);
  await (await pool.connect(oracle).claimPrize()).wait();
  const oracleUsdtAfter = await usdt.balanceOf(oracle.address);
  console.log("       received:", (oracleUsdtAfter - oracleUsdtBefore).toString(), "USDT raw");

  console.log("\n[5/6] Both withdrawing $5 deposit...");
  const deployerBefore = await usdt.balanceOf(deployer.address);
  await (await pool.withdrawDeposit()).wait();
  const deployerAfter = await usdt.balanceOf(deployer.address);
  console.log("       deployer received:", (deployerAfter - deployerBefore).toString(), "USDT raw");

  const oracleWdBefore = await usdt.balanceOf(oracle.address);
  await (await pool.connect(oracle).withdrawDeposit()).wait();
  const oracleWdAfter = await usdt.balanceOf(oracle.address);
  console.log("       oracle received: ", (oracleWdAfter - oracleWdBefore).toString(), "USDT raw");

  console.log("\n[6/6] Final state:");
  console.log("       prizeClaimed:", await pool.prizeClaimed());
  console.log("       depositWithdrawn(deployer):", await pool.depositWithdrawn(deployer.address));
  console.log("       depositWithdrawn(oracle):", await pool.depositWithdrawn(oracle.address));
  console.log("       contract USDT balance:", (await usdt.balanceOf(POOL)).toString(), "(expected 0)");

  console.log("\nDRY RUN COMPLETE ✅");
}

main().catch((e) => { console.error(e); process.exit(1); });
