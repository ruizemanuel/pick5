import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

// Read-only sanity check before the real mainnet deploy.
// Confirms: deployer balance, env vars set, target addresses match spec.
// Run: pnpm hardhat run scripts/preflight-mainnet.ts --network celo

const CELO_USDT = "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e";
const CELO_AAVE = "0x3E59A31363E2ad014dcbc521c4a0d5757d9f3402";
const CELO_AUSDT = "0xDeE98402A302e4D707fB9bf2bac66fAEEc31e8Df";
const ERC20_ABI = ["function balanceOf(address) view returns (uint256)", "function decimals() view returns (uint8)"];

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log("=== Preflight — Celo mainnet ===");
  console.log("Network:", network.name, "chainId:", network.chainId.toString());
  if (network.chainId !== 42220n) {
    throw new Error(`Wrong network — expected 42220 (Celo), got ${network.chainId}`);
  }

  console.log("\n-- Deployer --");
  console.log("Address:", deployer.address);
  const celoBal = await ethers.provider.getBalance(deployer.address);
  console.log("CELO balance:", ethers.formatEther(celoBal));

  const usdt = new ethers.Contract(CELO_USDT, ERC20_ABI, ethers.provider);
  const usdtBal = await usdt.balanceOf(deployer.address);
  console.log("USDT balance:", ethers.formatUnits(usdtBal, 6));

  console.log("\n-- Env vars --");
  const oracleAddr = process.env.ORACLE_ADDRESS;
  const coachAddr = process.env.COACH_ADDRESS;
  console.log("ORACLE_ADDRESS:", oracleAddr ?? "(MISSING)");
  console.log("COACH_ADDRESS :", coachAddr ?? "(MISSING)");
  console.log("CELOSCAN_API_KEY:", process.env.CELOSCAN_API_KEY ? "(set)" : "(MISSING)");

  console.log("\n-- Target external contracts (Celo mainnet) --");
  console.log("USDT     :", CELO_USDT);
  console.log("Aave Pool:", CELO_AAVE);
  console.log("aUSDT    :", CELO_AUSDT);

  console.log("\n-- Tournament times (from deploy.ts) --");
  const lockTime = Math.floor(new Date("2026-05-16T14:00:00Z").getTime() / 1000);
  const endTime  = Math.floor(new Date("2026-05-24T19:00:00Z").getTime() / 1000);
  console.log("lockTime:", new Date(lockTime * 1000).toISOString(), `(${lockTime})`);
  console.log("endTime :", new Date(endTime * 1000).toISOString(), `(${endTime})`);
  const now = Math.floor(Date.now() / 1000);
  console.log("Now     :", new Date(now * 1000).toISOString(), `(${now})`);
  console.log("Runway to lock:", ((lockTime - now) / 86400).toFixed(2), "days");

  console.log("\n-- Checklist --");
  const minCelo = ethers.parseEther("5");
  const minUsdt = 15_000_000n; // 15 USDT @ 6 decimals
  const checks = [
    { label: "CELO >= 5",       ok: celoBal >= minCelo },
    { label: "USDT >= 15",      ok: usdtBal >= minUsdt },
    { label: "ORACLE_ADDRESS",  ok: !!oracleAddr },
    { label: "COACH_ADDRESS",   ok: !!coachAddr },
    { label: "CELOSCAN_API_KEY",ok: !!process.env.CELOSCAN_API_KEY },
    { label: "Lock in future",  ok: lockTime > now },
  ];
  for (const c of checks) console.log(`  ${c.ok ? "✅" : "❌"} ${c.label}`);

  const allOk = checks.every(c => c.ok);
  console.log(allOk ? "\nAll checks pass — ready to deploy." : "\nFix the ❌ items before running deploy.ts.");
}

main().catch((e) => { console.error(e); process.exit(1); });
