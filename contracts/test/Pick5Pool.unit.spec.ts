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
    expect(await pool.DEPOSIT()).to.equal(5_000_000n);
  });
});
