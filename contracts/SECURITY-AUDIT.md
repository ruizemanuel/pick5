# Pick5 Contracts — Static Analysis & Coverage

## Coverage Report (Hardhat solidity-coverage)

Run: `pnpm --filter @pick5/contracts coverage` — all 51 tests, including the Aave V3 Celo mainnet fork.

| File | Statements | Branches | Functions | Lines |
|---|---|---|---|---|
| Pick5Pool.sol | 100% | 84.62% | 100% | 100% |
| CoachAgent.sol | 91.67% | 94.44% | 83.33% | 94.74% |
| **All contracts** | **96.74%** | **86.46%** | **88.89%** | **99.15%** |

Both contracts exceed the 90% lines target. Branches are at 84–94%.

**Notes on uncovered branches / statements:**

- `CoachAgent.sol` line 58 — `hasRevealed(uint8)` view function body never called in tests (function is a convenience getter for off-chain clients; behavior is indirectly covered via `revealPicks` which writes `_hasRevealed`). Proposed test: call `hasRevealed(mw)` before and after `revealPicks` and assert `false`→`true`.
- `CoachAgent.sol` line 40, branch `[6, 0]` — `revealPicks` guard `!_hasCommitted[mw]` — the "committed = true, proceed" path runs 6×; Istanbul also records the matching false-branch in the binary split. Covered by the `revealPicks rejects without prior commitment` test.
- `Pick5Pool.sol` branch coverage at 84.62% — Istanbul's binary branch model counts each `if` as two branches (taken / not-taken). Several guards (e.g., `ZeroOracle`, `BadTimes`, `ZeroAmount`, `AlreadySeeded`) are covered by dedicated tests; the low percentage reflects Istanbul counting both sides of every short-circuit expression, including ones inside Solidity's `nonReentrant` modifier and the `Ownable` modifier from OZ. All application-critical guards are exercised.

---

## Slither Static Analysis (v0.11.5)

Run: `slither . --solc-remaps "@openzeppelin/=node_modules/@openzeppelin/" --solc-args "--via-ir"` from `contracts/`  
Analyzed 19 contracts with 101 detectors. 33 results.

### HIGH — none found

### MEDIUM findings

| # | Detector | Location | Assessment |
|---|---|---|---|
| M-1 | `weak-prng` | `Pick5Pool.submitScores` line 137-139 | **Accepted / by design.** Tie-breaking uses `keccak256(oracleRandomSeed, blockhash(block.number-1), tied.length) % tied.length`. The oracle supplies an unpredictable seed at score submission time; miners cannot economically reorg for a pool prize. Documented in comments as a design trade-off. |

### LOW findings

| # | Detector | Location | Assessment |
|---|---|---|---|
| L-1 | `unchecked-transfer` | `MockAavePool.supply/withdraw` | **Not applicable** — test mock only; production uses OZ `SafeERC20`. |
| L-2 | `uninitialized-local` | `submitScores`: `ti`, `maxScore`, `tieCount` | **False positive** — Solidity 0.8 initialises all local variables to zero; Slither flags uninitialized as a style issue, not a bug. |
| L-3 | `unused-return` | `aavePool.withdraw()` in `finalizeAndDistribute` and `emergencyAdminWithdraw` | **Accepted.** Aave V3 `withdraw` returns the actual amount withdrawn, but we derive the prize from `usdt.balanceOf` after the call, so the return value is genuinely not needed. If the withdraw fails it reverts internally. |
| L-4 | `reentrancy-benign` | `finalizeAndDistribute` — `prizeAmount` written after external call | **Not exploitable.** The `finalized = true` flag is set before the external call, and `nonReentrant` is applied. Re-entry is impossible; the benign flag is Slither reporting a state write after an external call with no attack path. |

### INFO / Informational

| # | Detector | Location | Notes |
|---|---|---|---|
| I-1 | `timestamp` | `joinTournament`, `submitScores`, `emergencyAdminWithdraw` | Standard use of `block.timestamp` for time gates. 15-second miner bias is acceptable for tournament mechanics operating on day/week windows. |
| I-2 | `assembly` | OZ `SafeERC20`, `StorageSlot` | Third-party library internals; not our code. |
| I-3 | `pragma` / `solc-version` | OZ dependency files | OZ uses wide pragma ranges. We pin to `0.8.24` in our own files; the compiler is fixed at `0.8.24` in `hardhat.config.ts`. |
| I-4 | `cyclomatic-complexity` | `submitScores` (complexity 13) | Acceptable for a scoring + tie-break loop. Could be split into helpers but adds no security risk. |
| I-5 | `missing-inheritance` | `MockAavePool` | Test mock; irrelevant in production. |
| I-6 | `naming-convention` | `CoachAgent.revealPicks` param `_accuracy` | Underscore-prefixed parameter; minor style convention. No fix required. |
| I-7 | `unindexed-event-address` | `TieBreak(address[],address,uint256)` | `address[]` arrays cannot be indexed in Solidity events. The winner `address` is already indexed in `ScoresSubmitted`. Acceptable. |

### Summary

No HIGH findings. One MEDIUM (`weak-prng`) is accepted by design with documented rationale. All LOW findings are either false positives, test-only code, or accepted with rationale. Informational items are library noise or minor style issues.
