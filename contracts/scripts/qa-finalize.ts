// QA finalize: simulate yield, submit scores (user wins), finalize.
// Must run AFTER endTime. Set TEST_POOL, TEST_USDT, TEST_AAVE, TEST_AUSDT, USER_WALLET in env.

import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import crypto from "node:crypto";

dotenv.config();

async function main() {
  const POOL = process.env.TEST_POOL!;
  const USDT = process.env.TEST_USDT!;
  const AAVE = process.env.TEST_AAVE!;
  const AUSDT = process.env.TEST_AUSDT!;
  const USER = process.env.USER_WALLET!;
  if (!POOL || !USDT || !AAVE || !AUSDT || !USER) {
    throw new Error("Set TEST_POOL, TEST_USDT, TEST_AAVE, TEST_AUSDT, USER_WALLET");
  }

  const deployer = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY!, ethers.provider);
  const oracle = new ethers.Wallet(process.env.ORACLE_PRIVATE_KEY!, ethers.provider);

  const pool = await ethers.getContractAt("Pick5Pool", POOL, deployer);
  const usdt = await ethers.getContractAt("MockUSDT", USDT, deployer);
  const aUsdt = await ethers.getContractAt("MockAUsdt", AUSDT, deployer);

  const now = Math.floor(Date.now() / 1000);
  const endTime = Number(await pool.endTime());
  if (now < endTime) {
    throw new Error(`Tournament not ended yet. Wait ${endTime - now}s.`);
  }

  console.log("\n[1/3] Simulating 0.5 USDT yield...");
  await (await aUsdt.mint(POOL, 500_000n)).wait();
  await (await usdt.mint(AAVE, 500_000n)).wait();

  // Read on-chain participants so we don't hardcode and so the call matches
  // the contract's LengthMismatch invariant (users.length == participants.length).
  const participantsLength = Number(await pool.participantsLength());
  const participants: string[] = [];
  for (let i = 0; i < participantsLength; i++) {
    const p = (await pool.participants(i)) as string;
    participants.push(p);
  }
  console.log(`       Found ${participants.length} participants:`, participants);

  // Score map: USER wins with 100, others get 50.
  const scores = participants.map((p) =>
    p.toLowerCase() === USER.toLowerCase() ? 100 : 50,
  );

  console.log("\n[2/3] Oracle submitting scores (USER wins with 100)...");
  const seed = "0x" + crypto.randomBytes(32).toString("hex");
  const tx = await pool.connect(oracle).submitScores(participants, scores, seed);
  await tx.wait();
  console.log("       winner       :", await pool.winner());
  console.log("       winningScore :", (await pool.winningScore()).toString());

  console.log("\n[3/3] Finalizing...");
  await (await pool.finalizeAndDistribute()).wait();
  const prize = await pool.prizeAmount();
  console.log("       prizeAmount  :", (Number(prize) / 1e6).toFixed(6), "USDT (expected 10.5)");
  console.log("       finalized    :", await pool.finalized());

  console.log("\n✅ Tournament finalized. User is winner.");
  console.log("\nNow in the browser:");
  console.log("  1. Hard refresh /results → see gold winner spotlight + prize counter");
  console.log("  2. Click 'Claim $10.50' → confirm tx → success toast");
  console.log("  3. Go to /profile → click 'Withdraw $5 Deposit' → confirm tx");
}

main().catch((e) => { console.error(e); process.exit(1); });
