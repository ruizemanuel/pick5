import { ethers } from "hardhat";

const POOL = process.env.TEST_POOL!;
const USDT = process.env.TEST_USDT!;
const USER = process.env.USER_WALLET!;

async function main() {
  const pool = await ethers.getContractAt("Pick5Pool", POOL);
  const usdt = await ethers.getContractAt("MockUSDT", USDT);

  const userBal = await usdt.balanceOf(USER);
  const poolBal = await usdt.balanceOf(POOL);
  const finalized = await pool.finalized();
  const prizeClaimed = await pool.prizeClaimed();
  const depositWithdrawn = await pool.depositWithdrawn(USER);
  const winner = await pool.winner();
  const prizeAmount = await pool.prizeAmount();

  console.log("=== Tournament state ===");
  console.log("finalized        :", finalized);
  console.log("winner           :", winner);
  console.log("prizeAmount      :", (Number(prizeAmount) / 1e6).toFixed(4), "USDT");
  console.log("prizeClaimed     :", prizeClaimed);
  console.log("depositWithdrawn :", depositWithdrawn);

  console.log("\n=== User balance ===");
  console.log("USDT contract    :", USDT);
  console.log("User wallet      :", USER);
  console.log("Balance          :", (Number(userBal) / 1e6).toFixed(4), "USDT");
  console.log("\n=== Pool residual ===");
  console.log("Pool USDT balance:", (Number(poolBal) / 1e6).toFixed(4), "USDT (expected 0)");
}

main().catch((e) => { console.error(e); process.exit(1); });
