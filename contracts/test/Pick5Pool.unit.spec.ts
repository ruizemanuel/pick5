import { expect } from "chai";
import { ethers } from "hardhat";
import type { Pick5Pool } from "../typechain-types";

describe("Pick5Pool — constructor + immutables", () => {
  it("stores oracle, usdt, aavePool, lockTime, endTime", async () => {
    const [admin, oracle, fakeUsdt, fakeAave, fakeAUsdt] = await ethers.getSigners();
    const lockTime = Math.floor(Date.now() / 1000) + 1000;
    const endTime = lockTime + 100_000;

    const Factory = await ethers.getContractFactory("Pick5Pool");
    const pool = (await Factory.deploy(
      oracle.address,
      fakeUsdt.address,
      fakeAave.address,
      fakeAUsdt.address,
      lockTime,
      endTime
    )) as unknown as Pick5Pool;

    expect(await pool.oracle()).to.equal(oracle.address);
    expect(await pool.usdt()).to.equal(fakeUsdt.address);
    expect(await pool.aavePool()).to.equal(fakeAave.address);
    expect(await pool.aUsdt()).to.equal(fakeAUsdt.address);
    expect(await pool.lockTime()).to.equal(BigInt(lockTime));
    expect(await pool.endTime()).to.equal(BigInt(endTime));
    expect(await pool.DEPOSIT()).to.equal(1_000_000n);
  });
});

async function deployFixture() {
  const [admin, oracle, alice, bob] = await ethers.getSigners();
  const Usdt = await ethers.getContractFactory("MockUSDT");
  const usdt = await Usdt.deploy();
  const AUsdt = await ethers.getContractFactory("MockAUsdt");
  const aUsdt = await AUsdt.deploy();
  const Aave = await ethers.getContractFactory("MockAavePool");
  const aave = await Aave.deploy(await usdt.getAddress(), await aUsdt.getAddress());

  const now = (await ethers.provider.getBlock("latest"))!.timestamp;
  const lockTime = now + 1000;
  const endTime = lockTime + 100_000;

  const Pool = await ethers.getContractFactory("Pick5Pool");
  const pool = await Pool.deploy(
    oracle.address,
    await usdt.getAddress(),
    await aave.getAddress(),
    await aUsdt.getAddress(),
    lockTime,
    endTime
  );

  await usdt.mint(admin.address, 100_000_000n);
  await usdt.mint(alice.address, 50_000_000n);
  await usdt.mint(bob.address, 50_000_000n);

  return { admin, oracle, alice, bob, usdt, aave, aUsdt, pool, lockTime, endTime };
}

describe("Pick5Pool — seedPool", () => {
  it("admin seeds pool, USDT goes to Aave, aUSDT goes to contract", async () => {
    const { admin, usdt, pool, aave, aUsdt } = await deployFixture();
    const seed = 10_000_000n;
    await usdt.connect(admin).approve(await pool.getAddress(), seed);
    await pool.connect(admin).seedPool(seed);
    expect(await pool.seedAmount()).to.equal(seed);
    expect(await aUsdt.balanceOf(await pool.getAddress())).to.equal(seed);
    expect(await usdt.balanceOf(await aave.getAddress())).to.equal(seed);
  });

  it("only owner can seed", async () => {
    const { alice, usdt, pool } = await deployFixture();
    await usdt.connect(alice).approve(await pool.getAddress(), 10_000_000n);
    await expect(pool.connect(alice).seedPool(10_000_000n))
      .to.be.revertedWithCustomError(pool, "OwnableUnauthorizedAccount");
  });

  it("rejects seedPool(0)", async () => {
    const { admin, pool } = await deployFixture();
    await expect(pool.connect(admin).seedPool(0))
      .to.be.revertedWithCustomError(pool, "ZeroAmount");
  });
});

describe("Pick5Pool — joinTournament", () => {
  it("user joins, deposit pulled, lineup stored, participant indexed", async () => {
    const { alice, usdt, pool, aUsdt } = await deployFixture();
    await usdt.connect(alice).approve(await pool.getAddress(), 5_000_000n);
    const lineup: [number, number, number, number, number] = [1, 2, 3, 4, 5];

    await expect(pool.connect(alice).joinTournament(lineup))
      .to.emit(pool, "Joined")
      .withArgs(alice.address, lineup, 0);

    expect(await pool.hasJoined(alice.address)).to.equal(true);
    expect(await aUsdt.balanceOf(await pool.getAddress())).to.equal(1_000_000n);
    const stored = await pool.getLineup(alice.address);
    expect(stored.map((x) => Number(x))).to.deep.equal(lineup);
    expect(await pool.participantsLength()).to.equal(1n);
  });

  it("rejects double-join", async () => {
    const { alice, usdt, pool } = await deployFixture();
    await usdt.connect(alice).approve(await pool.getAddress(), 10_000_000n);
    await pool.connect(alice).joinTournament([1, 2, 3, 4, 5]);
    await expect(pool.connect(alice).joinTournament([6, 7, 8, 9, 10]))
      .to.be.revertedWithCustomError(pool, "AlreadyJoined");
  });

  it("rejects after lockTime", async () => {
    const { alice, usdt, pool, lockTime } = await deployFixture();
    await ethers.provider.send("evm_setNextBlockTimestamp", [lockTime + 1]);
    await ethers.provider.send("evm_mine", []);
    await usdt.connect(alice).approve(await pool.getAddress(), 5_000_000n);
    await expect(pool.connect(alice).joinTournament([1, 2, 3, 4, 5]))
      .to.be.revertedWithCustomError(pool, "TournamentLocked");
  });

  it("rejects duplicate player IDs in lineup", async () => {
    const { alice, usdt, pool } = await deployFixture();
    await usdt.connect(alice).approve(await pool.getAddress(), 5_000_000n);
    await expect(pool.connect(alice).joinTournament([1, 2, 3, 3, 5]))
      .to.be.revertedWithCustomError(pool, "InvalidLineup");
  });

  it("rejects player ID 0 or > 999", async () => {
    const { alice, usdt, pool } = await deployFixture();
    await usdt.connect(alice).approve(await pool.getAddress(), 5_000_000n);
    await expect(pool.connect(alice).joinTournament([0, 2, 3, 4, 5]))
      .to.be.revertedWithCustomError(pool, "InvalidLineup");
    await expect(pool.connect(alice).joinTournament([1000, 2, 3, 4, 5]))
      .to.be.revertedWithCustomError(pool, "InvalidLineup");
  });
});

describe("Pick5Pool — submitScores", () => {
  it("oracle submits scores, identifies winner, sets state", async () => {
    const { oracle, alice, bob, usdt, pool, lockTime, endTime } = await deployFixture();
    await usdt.connect(alice).approve(await pool.getAddress(), 5_000_000n);
    await usdt.connect(bob).approve(await pool.getAddress(), 5_000_000n);
    await pool.connect(alice).joinTournament([1, 2, 3, 4, 5]);
    await pool.connect(bob).joinTournament([6, 7, 8, 9, 10]);

    await ethers.provider.send("evm_setNextBlockTimestamp", [endTime + 1]);
    await ethers.provider.send("evm_mine", []);

    const seed = "0x" + "ab".repeat(32);
    await expect(pool.connect(oracle).submitScores([alice.address, bob.address], [42, 100], seed))
      .to.emit(pool, "ScoresSubmitted")
      .withArgs(bob.address, 100);

    expect(await pool.scoresSubmitted()).to.equal(true);
    expect(await pool.winner()).to.equal(bob.address);
    expect(await pool.scores(alice.address)).to.equal(42n);
    expect(await pool.scores(bob.address)).to.equal(100n);
  });

  it("rejects non-oracle caller", async () => {
    const { alice, pool, endTime } = await deployFixture();
    await ethers.provider.send("evm_setNextBlockTimestamp", [endTime + 1]);
    await ethers.provider.send("evm_mine", []);
    await expect(
      pool.connect(alice).submitScores([alice.address], [1], "0x" + "00".repeat(32))
    ).to.be.revertedWithCustomError(pool, "NotOracle");
  });

  it("rejects before endTime", async () => {
    const { oracle, pool } = await deployFixture();
    await expect(
      pool.connect(oracle).submitScores([], [], "0x" + "00".repeat(32))
    ).to.be.revertedWithCustomError(pool, "TournamentNotEnded");
  });

  it("rejects zero participants", async () => {
    const { oracle, pool, endTime } = await deployFixture();
    await ethers.provider.send("evm_setNextBlockTimestamp", [endTime + 1]);
    await ethers.provider.send("evm_mine", []);
    await expect(
      pool.connect(oracle).submitScores([], [], "0x" + "00".repeat(32))
    ).to.be.revertedWithCustomError(pool, "NoParticipants");
  });

  it("rejects mismatched array lengths", async () => {
    const { oracle, alice, usdt, pool, endTime } = await deployFixture();
    await usdt.connect(alice).approve(await pool.getAddress(), 5_000_000n);
    await pool.connect(alice).joinTournament([1, 2, 3, 4, 5]);
    await ethers.provider.send("evm_setNextBlockTimestamp", [endTime + 1]);
    await ethers.provider.send("evm_mine", []);
    await expect(
      pool.connect(oracle).submitScores([alice.address], [1, 2], "0x" + "00".repeat(32))
    ).to.be.revertedWithCustomError(pool, "LengthMismatch");
  });

  it("rejects mismatch with participants count", async () => {
    const { oracle, alice, bob, usdt, pool, endTime } = await deployFixture();
    await usdt.connect(alice).approve(await pool.getAddress(), 5_000_000n);
    await usdt.connect(bob).approve(await pool.getAddress(), 5_000_000n);
    await pool.connect(alice).joinTournament([1, 2, 3, 4, 5]);
    await pool.connect(bob).joinTournament([6, 7, 8, 9, 10]);
    await ethers.provider.send("evm_setNextBlockTimestamp", [endTime + 1]);
    await ethers.provider.send("evm_mine", []);
    await expect(
      pool.connect(oracle).submitScores([alice.address], [42], "0x" + "00".repeat(32))
    ).to.be.revertedWithCustomError(pool, "LengthMismatch");
  });

  it("rejects double-submit", async () => {
    const { oracle, alice, usdt, pool, endTime } = await deployFixture();
    await usdt.connect(alice).approve(await pool.getAddress(), 5_000_000n);
    await pool.connect(alice).joinTournament([1, 2, 3, 4, 5]);
    await ethers.provider.send("evm_setNextBlockTimestamp", [endTime + 1]);
    await ethers.provider.send("evm_mine", []);
    const seed = "0x" + "cd".repeat(32);
    await pool.connect(oracle).submitScores([alice.address], [42], seed);
    await expect(
      pool.connect(oracle).submitScores([alice.address], [42], seed)
    ).to.be.revertedWithCustomError(pool, "AlreadySubmitted");
  });
});

describe("Pick5Pool — finalize + claim + withdraw", () => {
  it("full happy path: 2 users, winner takes yield + seed, both withdraw deposit", async () => {
    const { admin, oracle, alice, bob, usdt, aave, aUsdt, pool, endTime } = await deployFixture();

    // seed
    await usdt.connect(admin).approve(await pool.getAddress(), 10_000_000n);
    await pool.connect(admin).seedPool(10_000_000n);

    // alice + bob join
    await usdt.connect(alice).approve(await pool.getAddress(), 5_000_000n);
    await usdt.connect(bob).approve(await pool.getAddress(), 5_000_000n);
    await pool.connect(alice).joinTournament([1, 2, 3, 4, 5]);
    await pool.connect(bob).joinTournament([6, 7, 8, 9, 10]);

    // simulate yield: mint extra aUSDT to pool + backing USDT to MockAavePool
    await aUsdt.mint(await pool.getAddress(), 1_000_000n); // $1 yield (aUSDT)
    await usdt.mint(await aave.getAddress(), 1_000_000n);  // backing USDT for the yield

    // submit scores after endTime
    await ethers.provider.send("evm_setNextBlockTimestamp", [endTime + 1]);
    await ethers.provider.send("evm_mine", []);
    await pool.connect(oracle).submitScores(
      [alice.address, bob.address],
      [42, 100],
      "0x" + "ab".repeat(32)
    );

    // finalize (anyone)
    await expect(pool.connect(alice).finalizeAndDistribute())
      .to.emit(pool, "Finalized");

    // total in pool = 10 (seed) + 1 (alice) + 1 (bob) + 1 (yield) = 13 USDT
    // totalDeposits = DEPOSIT * 2 = 2 USDT
    // prizeAmount = 13 - 2 = 11 USDT (seed + yield go to winner)
    expect(await pool.prizeAmount()).to.equal(11_000_000n);

    // bob (winner) claims
    const bobBefore = await usdt.balanceOf(bob.address);
    await pool.connect(bob).claimPrize();
    expect((await usdt.balanceOf(bob.address)) - bobBefore).to.equal(11_000_000n);

    // alice withdraws deposit
    const aliceBefore = await usdt.balanceOf(alice.address);
    await pool.connect(alice).withdrawDeposit();
    expect((await usdt.balanceOf(alice.address)) - aliceBefore).to.equal(1_000_000n);

    // bob also withdraws deposit
    const bobBefore2 = await usdt.balanceOf(bob.address);
    await pool.connect(bob).withdrawDeposit();
    expect((await usdt.balanceOf(bob.address)) - bobBefore2).to.equal(1_000_000n);
  });

  it("non-winner cannot claim", async () => {
    const { admin, oracle, alice, bob, usdt, pool, endTime } = await deployFixture();
    await usdt.connect(admin).approve(await pool.getAddress(), 10_000_000n);
    await pool.connect(admin).seedPool(10_000_000n);
    await usdt.connect(alice).approve(await pool.getAddress(), 5_000_000n);
    await usdt.connect(bob).approve(await pool.getAddress(), 5_000_000n);
    await pool.connect(alice).joinTournament([1, 2, 3, 4, 5]);
    await pool.connect(bob).joinTournament([6, 7, 8, 9, 10]);
    await ethers.provider.send("evm_setNextBlockTimestamp", [endTime + 1]);
    await ethers.provider.send("evm_mine", []);
    await pool.connect(oracle).submitScores(
      [alice.address, bob.address], [42, 100], "0x" + "ab".repeat(32)
    );
    await pool.connect(alice).finalizeAndDistribute();
    await expect(pool.connect(alice).claimPrize())
      .to.be.revertedWithCustomError(pool, "NotWinner");
  });

  it("cannot withdraw twice", async () => {
    const { admin, oracle, alice, usdt, pool, endTime } = await deployFixture();
    await usdt.connect(admin).approve(await pool.getAddress(), 10_000_000n);
    await pool.connect(admin).seedPool(10_000_000n);
    await usdt.connect(alice).approve(await pool.getAddress(), 5_000_000n);
    await pool.connect(alice).joinTournament([1, 2, 3, 4, 5]);
    await ethers.provider.send("evm_setNextBlockTimestamp", [endTime + 1]);
    await ethers.provider.send("evm_mine", []);
    await pool.connect(oracle).submitScores([alice.address], [42], "0x" + "ab".repeat(32));
    await pool.connect(alice).finalizeAndDistribute();
    await pool.connect(alice).withdrawDeposit();
    await expect(pool.connect(alice).withdrawDeposit())
      .to.be.revertedWithCustomError(pool, "AlreadyWithdrawn");
  });

  it("cannot claim twice", async () => {
    const { admin, oracle, alice, bob, usdt, pool, endTime } = await deployFixture();
    await usdt.connect(admin).approve(await pool.getAddress(), 10_000_000n);
    await pool.connect(admin).seedPool(10_000_000n);
    await usdt.connect(alice).approve(await pool.getAddress(), 5_000_000n);
    await usdt.connect(bob).approve(await pool.getAddress(), 5_000_000n);
    await pool.connect(alice).joinTournament([1, 2, 3, 4, 5]);
    await pool.connect(bob).joinTournament([6, 7, 8, 9, 10]);
    await ethers.provider.send("evm_setNextBlockTimestamp", [endTime + 1]);
    await ethers.provider.send("evm_mine", []);
    await pool.connect(oracle).submitScores(
      [alice.address, bob.address], [42, 100], "0x" + "ab".repeat(32)
    );
    await pool.connect(alice).finalizeAndDistribute();
    await pool.connect(bob).claimPrize();
    await expect(pool.connect(bob).claimPrize())
      .to.be.revertedWithCustomError(pool, "AlreadyClaimed");
  });

  it("cannot finalize twice", async () => {
    const { admin, oracle, alice, usdt, pool, endTime } = await deployFixture();
    await usdt.connect(admin).approve(await pool.getAddress(), 10_000_000n);
    await pool.connect(admin).seedPool(10_000_000n);
    await usdt.connect(alice).approve(await pool.getAddress(), 5_000_000n);
    await pool.connect(alice).joinTournament([1, 2, 3, 4, 5]);
    await ethers.provider.send("evm_setNextBlockTimestamp", [endTime + 1]);
    await ethers.provider.send("evm_mine", []);
    await pool.connect(oracle).submitScores([alice.address], [42], "0x" + "ab".repeat(32));
    await pool.connect(alice).finalizeAndDistribute();
    await expect(pool.connect(alice).finalizeAndDistribute())
      .to.be.revertedWithCustomError(pool, "AlreadyFinalized");
  });

  it("cannot withdraw before scores submitted", async () => {
    const { admin, alice, usdt, pool } = await deployFixture();
    await usdt.connect(admin).approve(await pool.getAddress(), 10_000_000n);
    await pool.connect(admin).seedPool(10_000_000n);
    await usdt.connect(alice).approve(await pool.getAddress(), 5_000_000n);
    await pool.connect(alice).joinTournament([1, 2, 3, 4, 5]);
    await expect(pool.connect(alice).withdrawDeposit())
      .to.be.revertedWithCustomError(pool, "ScoresNotSubmitted");
  });

  it("non-participant cannot withdraw", async () => {
    const { admin, oracle, alice, bob, usdt, pool, endTime } = await deployFixture();
    await usdt.connect(admin).approve(await pool.getAddress(), 10_000_000n);
    await pool.connect(admin).seedPool(10_000_000n);
    await usdt.connect(alice).approve(await pool.getAddress(), 5_000_000n);
    await pool.connect(alice).joinTournament([1, 2, 3, 4, 5]);
    await ethers.provider.send("evm_setNextBlockTimestamp", [endTime + 1]);
    await ethers.provider.send("evm_mine", []);
    await pool.connect(oracle).submitScores([alice.address], [42], "0x" + "ab".repeat(32));
    await pool.connect(alice).finalizeAndDistribute();
    await expect(pool.connect(bob).withdrawDeposit())
      .to.be.revertedWithCustomError(pool, "NotJoined");
  });
});

describe("Pick5Pool — emergencyAdminWithdraw", () => {
  it("admin recovers seed if no participants joined and 7 days passed", async () => {
    const { admin, usdt, pool, endTime } = await deployFixture();
    await usdt.connect(admin).approve(await pool.getAddress(), 10_000_000n);
    await pool.connect(admin).seedPool(10_000_000n);

    await ethers.provider.send("evm_setNextBlockTimestamp", [endTime + 7 * 86400 + 1]);
    await ethers.provider.send("evm_mine", []);

    const before = await usdt.balanceOf(admin.address);
    await pool.connect(admin).emergencyAdminWithdraw();
    const after = await usdt.balanceOf(admin.address);
    expect(after - before).to.equal(10_000_000n);
  });

  it("rejects if participants > 0", async () => {
    const { admin, alice, usdt, pool, endTime } = await deployFixture();
    await usdt.connect(admin).approve(await pool.getAddress(), 10_000_000n);
    await pool.connect(admin).seedPool(10_000_000n);
    await usdt.connect(alice).approve(await pool.getAddress(), 5_000_000n);
    await pool.connect(alice).joinTournament([1, 2, 3, 4, 5]);
    await ethers.provider.send("evm_setNextBlockTimestamp", [endTime + 7 * 86400 + 1]);
    await ethers.provider.send("evm_mine", []);
    await expect(pool.connect(admin).emergencyAdminWithdraw())
      .to.be.revertedWithCustomError(pool, "HasParticipants");
  });

  it("rejects before endTime + 7 days", async () => {
    const { admin, usdt, pool, endTime } = await deployFixture();
    await usdt.connect(admin).approve(await pool.getAddress(), 10_000_000n);
    await pool.connect(admin).seedPool(10_000_000n);
    await ethers.provider.send("evm_setNextBlockTimestamp", [endTime + 86400]);
    await ethers.provider.send("evm_mine", []);
    await expect(pool.connect(admin).emergencyAdminWithdraw())
      .to.be.revertedWithCustomError(pool, "TooEarly");
  });

  it("rejects unauthorized caller", async () => {
    const { alice, pool, endTime } = await deployFixture();
    await ethers.provider.send("evm_setNextBlockTimestamp", [endTime + 7 * 86400 + 1]);
    await ethers.provider.send("evm_mine", []);
    await expect(pool.connect(alice).emergencyAdminWithdraw())
      .to.be.revertedWithCustomError(pool, "OwnableUnauthorizedAccount");
  });
});
