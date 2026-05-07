import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

const ADDRESSES = {
  celo: {
    USDT:      "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e",
    AAVE_POOL: "0x3E59A31363E2ad014dcbc521c4a0d5757d9f3402",
    AUSDT:     "0xDeE98402A302e4D707fB9bf2bac66fAEEc31e8Df",
  },
};

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const isCelo = network.chainId === 42220n;
  const isAlfa = network.chainId === 44787n;
  const isSepolia = network.chainId === 11142220n;
  const isTestnet = isAlfa || isSepolia;
  const testnetName = isAlfa ? "Alfajores" : isSepolia ? "Celo Sepolia" : "";
  const testnetSuffix = isAlfa ? "ALFAJORES" : isSepolia ? "SEPOLIA" : "";

  console.log("Deployer:", deployer.address);
  console.log("Network:", network.name, network.chainId.toString());
  console.log("Balance (CELO):", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  // Tournament times
  // MW37 starts ~Sat 16/05/2026 14:00 UTC. End MW38 ~Sun 24/05/2026 19:00 UTC.
  const lockTime = Math.floor(new Date("2026-05-16T14:00:00Z").getTime() / 1000);
  const endTime  = Math.floor(new Date("2026-05-24T19:00:00Z").getTime() / 1000);

  let usdt: string, aavePool: string, aUsdt: string;

  if (isTestnet) {
    console.log(`\n[${testnetName}] Deploying mocks first...`);
    const Mock = await ethers.getContractFactory("MockUSDT");
    const mockUsdt = await Mock.deploy();
    await mockUsdt.waitForDeployment();
    const MockAU = await ethers.getContractFactory("MockAUsdt");
    const mockAU = await MockAU.deploy();
    await mockAU.waitForDeployment();
    const MockA = await ethers.getContractFactory("MockAavePool");
    const mockA = await MockA.deploy(await mockUsdt.getAddress(), await mockAU.getAddress());
    await mockA.waitForDeployment();
    usdt = await mockUsdt.getAddress();
    aavePool = await mockA.getAddress();
    aUsdt = await mockAU.getAddress();
    console.log("MockUSDT:", usdt);
    console.log("MockAavePool:", aavePool);
    console.log("MockAUsdt:", aUsdt);
  } else if (isCelo) {
    console.log("\n[Celo Mainnet] Using real Aave V3 + USDT...");
    usdt = ADDRESSES.celo.USDT;
    aavePool = ADDRESSES.celo.AAVE_POOL;
    aUsdt = ADDRESSES.celo.AUSDT;
  } else {
    throw new Error(`Unsupported network chainId: ${network.chainId}`);
  }

  const oracleAddr = process.env.ORACLE_ADDRESS;
  const coachAddr = process.env.COACH_ADDRESS;
  if (!oracleAddr || !coachAddr) {
    throw new Error("Set ORACLE_ADDRESS and COACH_ADDRESS in env");
  }

  console.log("\nOracle:", oracleAddr);
  console.log("Coach:", coachAddr);
  console.log("Lock time:", new Date(lockTime * 1000).toISOString());
  console.log("End time:", new Date(endTime * 1000).toISOString());

  console.log("\nDeploying Pick5Pool...");
  const Pool = await ethers.getContractFactory("Pick5Pool");
  const pool = await Pool.deploy(oracleAddr, usdt, aavePool, aUsdt, lockTime, endTime);
  await pool.waitForDeployment();
  const poolAddr = await pool.getAddress();
  console.log("Pick5Pool:", poolAddr);

  console.log("\nDeploying CoachAgent...");
  const Coach = await ethers.getContractFactory("CoachAgent");
  const coach = await Coach.deploy(coachAddr);
  await coach.waitForDeployment();
  const coachAddrDeployed = await coach.getAddress();
  console.log("CoachAgent:", coachAddrDeployed);

  console.log("\n=== Deployment summary ===");
  const suffix = isCelo ? "CELO" : testnetSuffix;
  console.log(`NEXT_PUBLIC_PICK5_POOL_${suffix}=${poolAddr}`);
  console.log(`NEXT_PUBLIC_COACH_AGENT_${suffix}=${coachAddrDeployed}`);
  if (isTestnet) {
    console.log(`NEXT_PUBLIC_USDT_${testnetSuffix}=${usdt}`);
  }
  const verifyNet = isCelo ? "celo" : isAlfa ? "alfajores" : "celo-sepolia";
  console.log("\nNext steps:");
  console.log(`  npx hardhat verify --network ${verifyNet} ${poolAddr} ${oracleAddr} ${usdt} ${aavePool} ${aUsdt} ${lockTime} ${endTime}`);
  console.log(`  npx hardhat verify --network ${verifyNet} ${coachAddrDeployed} ${coachAddr}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
