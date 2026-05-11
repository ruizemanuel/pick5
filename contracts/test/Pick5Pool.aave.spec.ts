import { expect } from "chai";
import { ethers } from "hardhat";

// Verified via eth_getCode on forno.celo.org (all three return non-empty bytecode).
// aUSDT confirmed by calling AavePool.getReserveData(USDT) and reading aTokenAddress field.
const USDT      = "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e";
const AAVE_POOL = "0x3E59A31363E2ad014dcbc521c4a0d5757d9f3402";
const AUSDT     = "0xDeE98402A302e4D707fB9bf2bac66fAEEc31e8Df";

// aUSDT contract itself holds ~7.4M USDT on Celo mainnet.
// Using it as the impersonated whale is safe in Hardhat fork mode.
const USDT_WHALE = "0xDeE98402A302e4D707fB9bf2bac66fAEEc31e8Df";

describe("Pick5Pool — Aave V3 Celo mainnet fork integration", function () {
  this.timeout(180_000);

  it("seed + 2 joins on real Aave Celo", async () => {
    const [admin, oracle, alice, bob] = await ethers.getSigners();

    // Impersonate the USDT whale (aUSDT contract)
    await ethers.provider.send("hardhat_impersonateAccount", [USDT_WHALE]);
    // Use hardhat_setBalance to fund the whale for gas (avoids needing a receive() function).
    // 100 CELO given to cover the high gas cost of calling through the aUSDT proxy.
    await ethers.provider.send("hardhat_setBalance", [
      USDT_WHALE,
      "0x56bc75e2d63100000", // 100 CELO in hex
    ]);
    const whale = await ethers.getSigner(USDT_WHALE);

    const usdt = await ethers.getContractAt("IERC20", USDT);

    // Distribute USDT to participants
    await usdt.connect(whale).transfer(admin.address,  30_000_000n); // 30 USDT (seed + buffer)
    await usdt.connect(whale).transfer(alice.address,   5_000_000n); //  5 USDT
    await usdt.connect(whale).transfer(bob.address,     5_000_000n); //  5 USDT

    // Deploy Pick5Pool against real Aave V3 + USDT
    const now = BigInt((await ethers.provider.getBlock("latest"))!.timestamp);
    const Pool = await ethers.getContractFactory("Pick5Pool");
    const pool = await Pool.deploy(
      oracle.address,
      USDT,
      AAVE_POOL,
      AUSDT,
      now + 100n,       // lockTime: 100 seconds from now
      now + 1_000_000n, // endTime
    );
    const poolAddr = await pool.getAddress();

    // ── Seed the pool ─────────────────────────────────────────────────────────
    await usdt.connect(admin).approve(poolAddr, 10_000_000n);
    await pool.connect(admin).seedPool(10_000_000n);

    expect(await pool.seedAmount()).to.equal(10_000_000n);

    // aUSDT balance on the pool should be >= 99% of seed (Aave is ~1:1)
    const aUsdt = await ethers.getContractAt("IERC20", AUSDT);
    const aUsdtAfterSeed = await aUsdt.balanceOf(poolAddr);
    expect(aUsdtAfterSeed).to.be.greaterThanOrEqual(9_900_000n);

    // ── Alice joins ────────────────────────────────────────────────────────────
    await usdt.connect(alice).approve(poolAddr, 5_000_000n);
    await pool.connect(alice).joinTournament([1, 2, 3, 4, 5]);

    expect(await pool.hasJoined(alice.address)).to.equal(true);
    const aUsdtAfterAlice = await aUsdt.balanceOf(poolAddr);
    // 10 USDT seed + 1 USDT from Alice (DEPOSIT) => at least 10.9 USDT in aUSDT
    expect(aUsdtAfterAlice).to.be.greaterThanOrEqual(10_900_000n);

    // ── Bob joins ──────────────────────────────────────────────────────────────
    await usdt.connect(bob).approve(poolAddr, 5_000_000n);
    await pool.connect(bob).joinTournament([6, 7, 8, 9, 10]);

    expect(await pool.hasJoined(bob.address)).to.equal(true);
    expect(await pool.participantsLength()).to.equal(2n);

    // Final aUSDT balance: 10 + 1 + 1 = 12 USDT; allow >= 99%
    const aUsdtFinal = await aUsdt.balanceOf(poolAddr);
    expect(aUsdtFinal).to.be.greaterThanOrEqual(11_900_000n);
  });
});
