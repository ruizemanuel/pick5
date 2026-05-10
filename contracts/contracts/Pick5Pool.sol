// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IAavePool {
    function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
}

contract Pick5Pool is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public immutable oracle;
    IERC20  public immutable usdt;
    IAavePool public immutable aavePool;
    IERC20  public immutable aUsdt;
    uint256 public immutable lockTime;
    uint256 public immutable endTime;
    uint256 public constant DEPOSIT = 5_000_000;
    uint256 public constant MAX_PARTICIPANTS = 500;
    uint256 public constant EMERGENCY_DELAY = 30 days;
    uint256 public constant ADMIN_EMERGENCY_DELAY = 60 days;

    uint256 public seedAmount;

    mapping(address => uint16[5]) private _lineups;
    mapping(address => bool)      public hasJoined;
    address[] public participants;

    event Seeded(uint256 amount);
    event Joined(address indexed user, uint16[5] lineup, uint256 participantIndex);

    error ZeroOracle();
    error BadTimes();
    error AlreadySeeded();
    error AlreadyJoined();
    error TournamentLocked();
    error InvalidLineup();
    error ZeroAmount();
    error PoolFull();

    constructor(
        address _oracle,
        IERC20 _usdt,
        IAavePool _aavePool,
        IERC20 _aUsdt,
        uint256 _lockTime,
        uint256 _endTime
    ) Ownable(msg.sender) {
        if (_oracle == address(0)) revert ZeroOracle();
        if (_lockTime >= _endTime) revert BadTimes();
        oracle = _oracle;
        usdt = _usdt;
        aavePool = _aavePool;
        aUsdt = _aUsdt;
        lockTime = _lockTime;
        endTime = _endTime;
    }

    function seedPool(uint256 amount) external onlyOwner nonReentrant {
        if (amount == 0) revert ZeroAmount();
        if (seedAmount > 0) revert AlreadySeeded();
        seedAmount = amount;
        usdt.safeTransferFrom(msg.sender, address(this), amount);
        usdt.forceApprove(address(aavePool), amount);
        aavePool.supply(address(usdt), amount, address(this), 0);
        emit Seeded(amount);
    }

    function joinTournament(uint16[5] calldata lineup) external nonReentrant {
        if (block.timestamp >= lockTime) revert TournamentLocked();
        if (hasJoined[msg.sender]) revert AlreadyJoined();
        if (participants.length >= MAX_PARTICIPANTS) revert PoolFull();
        _validateLineup(lineup);

        hasJoined[msg.sender] = true;
        _lineups[msg.sender] = lineup;
        uint256 idx = participants.length;
        participants.push(msg.sender);

        usdt.safeTransferFrom(msg.sender, address(this), DEPOSIT);
        usdt.forceApprove(address(aavePool), DEPOSIT);
        aavePool.supply(address(usdt), DEPOSIT, address(this), 0);

        emit Joined(msg.sender, lineup, idx);
    }

    mapping(address => uint128) public scores;
    bool    public scoresSubmitted;
    address public winner;
    uint128 public winningScore;

    event ScoresSubmitted(address indexed winner, uint128 winningScore);
    event TieBreak(address[] tied, address winner, uint256 seed);

    error NotOracle();
    error TournamentNotEnded();
    error AlreadySubmitted();
    error LengthMismatch();
    error NoParticipants();
    error UserMismatch();

    function submitScores(
        address[] calldata users,
        uint128[]  calldata points,
        uint256    randomSeed
    ) external {
        if (msg.sender != oracle) revert NotOracle();
        if (emergencyActive) revert EmergencyActiveErr();
        if (block.timestamp < endTime) revert TournamentNotEnded();
        if (scoresSubmitted) revert AlreadySubmitted();
        if (users.length != points.length) revert LengthMismatch();
        if (users.length != participants.length) revert LengthMismatch();
        if (users.length == 0) revert NoParticipants();

        uint128 maxScore;
        uint256 tieCount;
        for (uint256 i = 0; i < users.length; i++) {
            if (users[i] != participants[i]) revert UserMismatch();
            scores[users[i]] = points[i];
            if (points[i] > maxScore) {
                maxScore = points[i];
                tieCount = 1;
            } else if (points[i] == maxScore) {
                tieCount++;
            }
        }

        address[] memory tied = new address[](tieCount);
        uint256 ti;
        for (uint256 i = 0; i < users.length; i++) {
            if (points[i] == maxScore) {
                tied[ti++] = users[i];
            }
        }

        address w;
        if (tied.length == 1) {
            w = tied[0];
        } else {
            uint256 idx = uint256(keccak256(abi.encode(
                randomSeed, blockhash(block.number - 1), tied.length
            ))) % tied.length;
            w = tied[idx];
            emit TieBreak(tied, w, randomSeed);
        }

        winner = w;
        winningScore = maxScore;
        scoresSubmitted = true;
        emit ScoresSubmitted(w, maxScore);
    }

    bool    public finalized;
    uint128 public prizeAmount;
    mapping(address => bool) public depositWithdrawn;
    bool    public prizeClaimed;

    event Finalized(uint256 prizeAmount, uint256 yieldEarned);
    event DepositWithdrawn(address indexed user, uint256 amount);
    event PrizeClaimed(address indexed winner, uint256 amount);

    error ScoresNotSubmitted();
    error AlreadyFinalized();
    error AlreadyWithdrawn();
    error AlreadyClaimed();
    error NotWinner();
    error NotJoined();

    function finalizeAndDistribute() external nonReentrant {
        if (emergencyActive) revert EmergencyActiveErr();
        if (!scoresSubmitted) revert ScoresNotSubmitted();
        if (finalized) revert AlreadyFinalized();

        finalized = true;

        uint256 aBal = aUsdt.balanceOf(address(this));
        aavePool.withdraw(address(usdt), aBal, address(this));

        uint256 totalDeposits = DEPOSIT * participants.length;
        uint256 contractBal = usdt.balanceOf(address(this));
        uint256 prize = contractBal - totalDeposits;

        prizeAmount = uint128(prize);
        uint256 yieldEarned = prize > seedAmount ? prize - seedAmount : 0;
        emit Finalized(prize, yieldEarned);
    }

    function withdrawDeposit() external nonReentrant {
        if (!finalized) revert ScoresNotSubmitted();
        if (!hasJoined[msg.sender]) revert NotJoined();
        if (depositWithdrawn[msg.sender]) revert AlreadyWithdrawn();
        depositWithdrawn[msg.sender] = true;
        usdt.safeTransfer(msg.sender, DEPOSIT);
        emit DepositWithdrawn(msg.sender, DEPOSIT);
    }

    function claimPrize() external nonReentrant {
        if (emergencyActive) revert EmergencyActiveErr();
        if (!finalized) revert ScoresNotSubmitted();
        if (msg.sender != winner) revert NotWinner();
        if (prizeClaimed) revert AlreadyClaimed();
        prizeClaimed = true;
        usdt.safeTransfer(winner, prizeAmount);
        emit PrizeClaimed(winner, prizeAmount);
    }

    // ------------------------------------------------------------------ //
    // Emergency path — used when the oracle never submits scores.        //
    // Anyone can call triggerEmergency() after endTime + 30 days while   //
    // scores have not been submitted; this pulls all funds from Aave     //
    // and unblocks per-user emergencyUserWithdraw() refunds.             //
    // The owner can sweep any residual (seed + unclaimed deposits) after //
    // endTime + 60 days — gives joiners a 30-day claim window.           //
    // ------------------------------------------------------------------ //

    bool public emergencyActive;
    mapping(address => bool) public emergencyWithdrawn;

    event EmergencyTriggered(address indexed by, uint256 timestamp);
    event EmergencyUserWithdrawn(address indexed user, uint256 amount);
    event EmergencyWithdraw(address indexed admin, uint256 amount);

    error EmergencyAlreadyActive();
    error EmergencyNotElapsed();
    error EmergencyActiveErr();
    error EmergencyNotActive();
    error AlreadyEmergencyWithdrawn();
    error HasParticipants();
    error TooEarly();

    function triggerEmergency() external nonReentrant {
        if (emergencyActive) revert EmergencyAlreadyActive();
        if (block.timestamp < endTime + EMERGENCY_DELAY) revert EmergencyNotElapsed();
        if (scoresSubmitted) revert AlreadySubmitted();
        emergencyActive = true;
        uint256 aBal = aUsdt.balanceOf(address(this));
        if (aBal > 0) {
            aavePool.withdraw(address(usdt), aBal, address(this));
        }
        emit EmergencyTriggered(msg.sender, block.timestamp);
    }

    function emergencyUserWithdraw() external nonReentrant {
        if (!emergencyActive) revert EmergencyNotActive();
        if (!hasJoined[msg.sender]) revert NotJoined();
        if (emergencyWithdrawn[msg.sender]) revert AlreadyEmergencyWithdrawn();
        emergencyWithdrawn[msg.sender] = true;
        usdt.safeTransfer(msg.sender, DEPOSIT);
        emit EmergencyUserWithdrawn(msg.sender, DEPOSIT);
    }

    function emergencyAdminWithdraw() external onlyOwner nonReentrant {
        // Allowed in two situations:
        //  (a) No one joined and 7 days passed since endTime — original case,
        //      lets the owner reclaim the seed if the tournament drew nobody.
        //  (b) Emergency mode is active and the 60-day owner-cooldown is up —
        //      seed + any unclaimed deposits go back to the owner.
        bool emergencyOwnerWindow =
            emergencyActive && block.timestamp >= endTime + ADMIN_EMERGENCY_DELAY;
        if (!emergencyOwnerWindow) {
            if (block.timestamp < endTime + 7 days) revert TooEarly();
            if (participants.length > 0) revert HasParticipants();
        }

        // In the no-joiners path, Aave still holds the seed; pull it.
        // In emergency mode, triggerEmergency() already pulled.
        if (!emergencyActive) {
            uint256 aBal = aUsdt.balanceOf(address(this));
            if (aBal > 0) {
                aavePool.withdraw(address(usdt), aBal, address(this));
            }
        }
        uint256 bal = usdt.balanceOf(address(this));
        usdt.safeTransfer(owner(), bal);
        emit EmergencyWithdraw(owner(), bal);
    }

    function getLineup(address user) external view returns (uint16[5] memory) {
        return _lineups[user];
    }

    function participantsLength() external view returns (uint256) {
        return participants.length;
    }

    function _validateLineup(uint16[5] calldata lineup) private pure {
        for (uint8 i = 0; i < 5; i++) {
            if (lineup[i] == 0 || lineup[i] >= 1000) revert InvalidLineup();
            for (uint8 j = i + 1; j < 5; j++) {
                if (lineup[i] == lineup[j]) revert InvalidLineup();
            }
        }
    }
}
