import { expect } from "chai";
import { ethers } from "hardhat";

const USDT      = "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e";
const AAVE_POOL = "0x3E59A31363E2ad014dcbc521c4a0d5757d9f3402";
const AUSDT     = "0xDeE98402A302e4D707fB9bf2bac66fAEEc31e8Df";
const USDT_WHALE = "0xDeE98402A302e4D707fB9bf2bac66fAEEc31e8Df"; // aUSDT holds ~7.4M USDT

describe("SeasonPool — Aave V3 Celo mainnet fork integration", function () {
  this.timeout(180_000);

  it("seed + submit standings + finalize + champion claims on real Aave", async () => {
    const [admin, oracle, alice, bob] = await ethers.getSigners();

    await ethers.provider.send("hardhat_impersonateAccount", [USDT_WHALE]);
    await ethers.provider.send("hardhat_setBalance", [USDT_WHALE, "0x56bc75e2d63100000"]); // 100 CELO
    const whale = await ethers.getSigner(USDT_WHALE);

    const usdt = await ethers.getContractAt("IERC20", USDT);
    await usdt.connect(whale).transfer(admin.address, 60_000_000n); // 60 USDT (seed + buffer)

    const now = BigInt((await ethers.provider.getBlock("latest"))!.timestamp);
    const Impl = await ethers.getContractFactory("Pick5Pool");
    const impl = await Impl.deploy();
    const SeasonImpl = await ethers.getContractFactory("SeasonPool");
    const seasonImpl = await SeasonImpl.deploy();
    const FactoryC = await ethers.getContractFactory("Pick5PoolFactory");
    const factory = await FactoryC.deploy(
      await impl.getAddress(), USDT, AAVE_POOL, AUSDT, oracle.address, admin.address
    );
    await factory.setSeasonImplementation(await seasonImpl.getAddress());

    const endTime = now + 1000n;
    await factory.createSeason(endTime, "FORK SEASON");
    const season = await ethers.getContractAt("SeasonPool", await factory.seasonBy(0));

    // ── Seed on real Aave ──────────────────────────────────────────────────────
    const seed = 50_000_000n; // 50 USDT
    await usdt.connect(admin).approve(await season.getAddress(), seed);
    await season.connect(admin).seedPool(seed);
    expect(await season.seedAmount()).to.equal(seed);

    const aUsdt = await ethers.getContractAt("IERC20", AUSDT);
    expect(await aUsdt.balanceOf(await season.getAddress())).to.be.greaterThanOrEqual(49_500_000n);

    // ── Submit standings after endTime ─────────────────────────────────────────
    await ethers.provider.send("evm_setNextBlockTimestamp", [Number(endTime) + 1]);
    await ethers.provider.send("evm_mine", []);
    await season.connect(oracle).submitFinalStandings(
      [alice.address, bob.address], [100, 250], "0x" + "ab".repeat(32)
    );
    expect(await season.champion()).to.equal(bob.address);

    // ── Finalize + champion claims ─────────────────────────────────────────────
    await season.connect(alice).finalize();
    const prize = await season.prizeAmount();
    expect(prize).to.be.greaterThanOrEqual(49_500_000n); // >= 99% of seed (yield ~0 over the window)

    const before = await usdt.balanceOf(bob.address);
    await season.connect(bob).claimPrize();
    expect((await usdt.balanceOf(bob.address)) - before).to.equal(prize);
  });
});
