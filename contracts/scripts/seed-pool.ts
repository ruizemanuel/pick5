import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address) view returns (uint256)",
];

async function main() {
  const [admin] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const isCelo = network.chainId === 42220n;
  const isAlfa = network.chainId === 44787n;

  const poolAddr = isCelo
    ? process.env.PICK5_POOL_CELO
    : process.env.PICK5_POOL_ALFAJORES;
  const usdtAddr = isCelo
    ? "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e"
    : process.env.USDT_ALFAJORES;
  const seedAmount = BigInt(process.env.SEED_AMOUNT ?? "10000000"); // 10 USDT default

  if (!poolAddr || !usdtAddr) {
    throw new Error(`Missing env: pool=${poolAddr} usdt=${usdtAddr}`);
  }

  const usdt = new ethers.Contract(usdtAddr, ERC20_ABI, admin);
  const balance: bigint = await usdt.balanceOf(admin.address);
  console.log("Admin USDT balance:", balance.toString());
  if (balance < seedAmount) throw new Error(`Insufficient USDT (need ${seedAmount}, have ${balance})`);

  console.log(`Approving ${seedAmount} USDT to pool ${poolAddr}...`);
  const approveTx = await usdt.approve(poolAddr, seedAmount);
  await approveTx.wait();
  console.log("Approved. tx:", approveTx.hash);

  const pool = await ethers.getContractAt("Pick5Pool", poolAddr);
  console.log(`Calling seedPool(${seedAmount})...`);
  const seedTx = await pool.connect(admin).seedPool(seedAmount);
  const receipt = await seedTx.wait();
  console.log("Seeded. tx:", seedTx.hash);
}

main().catch(e => { console.error(e); process.exit(1); });
