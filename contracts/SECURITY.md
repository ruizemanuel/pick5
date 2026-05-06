# Pick5 — Security Review (Pashov checklist)

This document records how Pick5's smart contracts address each item of the Pashov security checklist before mainnet deploy. Pair this with `SECURITY-AUDIT.md` for the corresponding Slither + coverage report.

## Contracts in scope

- `Pick5Pool.sol` — tournament custody, Aave deposits/withdrawals, winner declaration, claim/withdraw
- `CoachAgent.sol` — Coach AI commit-reveal for picks + accuracy

## Pashov checklist results

| # | Item | Pick5Pool | CoachAgent |
|---|---|---|---|
| 1 | Reentrancy | PASS — `ReentrancyGuard` on every external function that does an ERC-20 transfer or Aave call (`seedPool`, `joinTournament`, `finalizeAndDistribute`, `withdrawDeposit`, `claimPrize`, `emergencyAdminWithdraw`). State changes happen before external calls (CEI). | N/A — no external calls |
| 2 | Integer over/underflow | PASS — Solidity 0.8.24 native checked arithmetic. `prizeAmount` is `uint128(prize)` cast: documented as safe at our scale (USDT 6 decimals, max realistic pool ≪ 2^128). | PASS |
| 3 | Access control | PASS — `oracle` is immutable, set in constructor. `Ownable` for `seedPool` and `emergencyAdminWithdraw`. No upgrades, no proxy admin. | PASS — `coachWallet` immutable, all mutating functions have `onlyCoach` modifier |
| 4 | Front-running / MEV | PASS — `joinTournament` is self-deposit only (no swap/auction). `submitScores` is oracle-only. No front-runnable surfaces. | PASS — commit-reveal is naturally front-running resistant |
| 5 | Oracle manipulation | DOCUMENTED RISK — backend-signed oracle is single trust point. Mitigation: oracle reads FPL official public API; oracle wallet is dedicated and key-isolated. V2 mitigation = signature-verified payloads + multi-oracle quorum. | N/A |
| 6 | Unchecked external calls | PASS — `SafeERC20.safeTransferFrom` and `safeTransfer` for all USDT calls (USDT historically returns inconsistent bool). `forceApprove` used before Aave supply to handle non-zero allowance edge cases. Aave's `supply` and `withdraw` revert on failure (no silent failure path). | N/A |
| 7 | Centralization risks | DOCUMENTED — `oracle` can submit any score values. `Ownable` admin can recover seed via `emergencyAdminWithdraw` only after `endTime + 7 days` AND only when no participants joined. No upgradeability. Recovery for "oracle never signs" deferred to V2 (would require a fallback distribution path). | DOCUMENTED — `coachWallet` key compromise allows false commitments but cannot affect Pick5Pool game state (separation of concerns) |
| 8 | Event emissions | PASS — every state change emits an event: `Seeded`, `Joined`, `ScoresSubmitted`, `TieBreak` (when tie), `Finalized`, `DepositWithdrawn`, `PrizeClaimed`, `EmergencyWithdraw`. | PASS — `PicksCommitted`, `PicksRevealed` |

## Trust assumptions

These are documented and accepted for V1 (Proof of Ship May 2026 edition):

1. **Oracle is honest.** A malicious oracle can submit arbitrary scores. Mitigation = dedicated wallet, key-isolated, monitoring. V2 = signature verification + multi-oracle.
2. **Aave V3 on Celo is operational.** If Aave is paused, `withdraw` will revert and funds stay stuck until Aave resumes. Realistic risk: very low for stable lending.
3. **Coach wallet is honest.** A malicious Coach can commit and reveal arbitrary picks; this affects ERC-8004 reputation only, not game funds.
4. **`uint128` cast for `prizeAmount` does not overflow.** Realistic prize amounts are in the order of $10–$100 USDT (10⁷–10⁸ raw units), far below `2^128 ≈ 3.4×10^38`.

## Out of scope (V2)

- `emergencyDistribute(fallbackWinner)` if oracle never signs after a deadline
- UUPS upgradeability (intentionally avoided in V1 for audit simplicity)
- Sybil resistance enforcement at claim (Self mandatory)
- Chainlink VRF for tie-breaking (current keccak with off-chain seed accepted at $10 prize scale)

## Audit artifacts

- `SECURITY-AUDIT.md` — Slither static analysis + coverage report
- This document — Pashov checklist
- Test suite (51 tests, 99% line coverage) — under `contracts/test/`
