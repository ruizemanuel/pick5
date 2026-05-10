import { ethers } from "hardhat";

const POOL = process.env.TEST_POOL!;
const USER = process.env.USER_WALLET!;

async function main() {
  const pool = await ethers.getContractAt("Pick5Pool", POOL);
  console.log("participants:", (await pool.participantsLength()).toString());
  console.log("hasJoined(user):", await pool.hasJoined(USER));
  if (await pool.hasJoined(USER)) {
    const lin = (await pool.getLineup(USER)) as bigint[];
    console.log("user lineup:", lin.map((x) => x.toString()).join(", "));
  }
  const endTime = Number(await pool.endTime());
  const lockTime = Number(await pool.lockTime());
  const now = Math.floor(Date.now() / 1000);
  console.log("lockTime:", new Date(lockTime * 1000).toISOString());
  console.log("endTime :", new Date(endTime * 1000).toISOString());
  console.log("now     :", new Date(now * 1000).toISOString());
  console.log("until lock:", lockTime - now, "s");
  console.log("until end :", endTime - now, "s");
}

main().catch((e) => { console.error(e); process.exit(1); });
