// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { OwnableUpgradeable } from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

interface IAavePool {
    function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
}

interface ISeasonFactory {
    function oracle() external view returns (address);
}

/// @title SeasonPool
/// @notice Season-long prize escrow for Pick5 V2. The owner seeds a prize that
/// accrues Aave yield over the whole season; after `endTime` the factory's
/// rotatable oracle submits the aggregate standings (built off-chain from every
/// wallet that played >= 1 fecha), the contract records them and picks the
/// champion with a verifiable tie-break, then the champion claims seed + yield.
/// No per-user deposits — that's why it cannot reuse Pick5Pool (whose
/// submitScores is coupled 1:1 to the on-chain participants array).
contract SeasonPool is Initializable, OwnableUpgradeable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    address   public factory;     // source of the (rotatable) oracle
    IERC20    public usdt;
    IAavePool public aavePool;
    IERC20    public aUsdt;
    uint256   public endTime;     // season end; standings can only be submitted after
    uint256   public seasonId;
    string    public label;

    uint256 public constant EMERGENCY_DELAY = 30 days;

    uint256 public seedAmount;

    mapping(address => uint128) public scores; // aggregate season score per wallet
    bool    public standingsSubmitted;
    address public champion;
    uint128 public championScore;

    bool    public finalized;
    uint128 public prizeAmount;
    bool    public prizeClaimed;

    event Seeded(uint256 amount);
    event FinalStandingsSubmitted(address indexed champion, uint128 championScore);
    event TieBreak(address[] tied, address winner, uint256 seed);
    event Finalized(uint256 prizeAmount, uint256 yieldEarned);
    event PrizeClaimed(address indexed champion, uint256 amount);
    event EmergencyWithdraw(address indexed admin, uint256 amount);

    error BadTimes();
    error ZeroAmount();
    error AlreadySeeded();
    error NotOracle();
    error SeasonNotEnded();
    error AlreadySubmitted();
    error LengthMismatch();
    error NoStandings();
    error StandingsNotSubmitted();
    error AlreadyFinalized();
    error NotFinalized();
    error NotChampion();
    error AlreadyClaimed();
    error TooEarly();

    /// @dev The implementation is never used directly — only cloned + initialized
    /// by the factory. Lock it so the implementation itself can't be initialized.
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _factory,
        address _owner,
        address _usdt,
        address _aavePool,
        address _aUsdt,
        uint256 _endTime,
        uint256 _seasonId,
        string calldata _label
    ) external initializer {
        if (_endTime <= block.timestamp) revert BadTimes();
        __Ownable_init(_owner);
        factory = _factory;
        usdt = IERC20(_usdt);
        aavePool = IAavePool(_aavePool);
        aUsdt = IERC20(_aUsdt);
        endTime = _endTime;
        seasonId = _seasonId;
        label = _label;
    }

    /// @notice Oracle is read from the factory at call time so it can be rotated
    /// without touching live seasons (same pattern as Pick5Pool, Phase B.1).
    function oracle() public view returns (address) {
        return ISeasonFactory(factory).oracle();
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

    /// @notice Oracle submits the season's aggregate standings after endTime.
    /// Unlike Pick5Pool.submitScores there is NO participants-array coupling:
    /// the qualifier set ("played >= 1 fecha") is enforced off-chain by the
    /// oracle. Scores are stored on-chain for transparency + the season table.
    function submitFinalStandings(
        address[] calldata wallets,
        uint128[]  calldata points,
        uint256    randomSeed
    ) external {
        if (msg.sender != ISeasonFactory(factory).oracle()) revert NotOracle();
        if (block.timestamp < endTime) revert SeasonNotEnded();
        if (standingsSubmitted) revert AlreadySubmitted();
        if (wallets.length != points.length) revert LengthMismatch();
        if (wallets.length == 0) revert NoStandings();

        uint128 maxScore;
        uint256 tieCount;
        for (uint256 i = 0; i < wallets.length; i++) {
            scores[wallets[i]] = points[i];
            if (points[i] > maxScore) {
                maxScore = points[i];
                tieCount = 1;
            } else if (points[i] == maxScore) {
                tieCount++;
            }
        }

        address[] memory tied = new address[](tieCount);
        uint256 ti;
        for (uint256 i = 0; i < wallets.length; i++) {
            if (points[i] == maxScore) {
                tied[ti++] = wallets[i];
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

        champion = w;
        championScore = maxScore;
        standingsSubmitted = true;
        emit FinalStandingsSubmitted(w, maxScore);
    }

    /// @notice Realize the prize: withdraw everything from Aave. No deposits to
    /// subtract, so the whole balance (seed + yield) is the prize. Permissionless.
    function finalize() external nonReentrant {
        if (!standingsSubmitted) revert StandingsNotSubmitted();
        if (finalized) revert AlreadyFinalized();
        finalized = true;

        uint256 aBal = aUsdt.balanceOf(address(this));
        if (aBal > 0) {
            aavePool.withdraw(address(usdt), aBal, address(this));
        }
        uint256 bal = usdt.balanceOf(address(this));
        prizeAmount = uint128(bal);
        uint256 yieldEarned = bal > seedAmount ? bal - seedAmount : 0;
        emit Finalized(bal, yieldEarned);
    }

    function claimPrize() external nonReentrant {
        if (!finalized) revert NotFinalized();
        if (msg.sender != champion) revert NotChampion();
        if (prizeClaimed) revert AlreadyClaimed();
        prizeClaimed = true;
        usdt.safeTransfer(champion, prizeAmount);
        emit PrizeClaimed(champion, prizeAmount);
    }

    /// @notice Owner recovers the seed ONLY if the oracle never submitted
    /// standings and the emergency delay elapsed (no user funds are ever at risk
    /// here — the owner is the sole depositor). If standings exist, finalize() is
    /// permissionless and the champion path takes over, so emergency is blocked.
    function emergencyAdminWithdraw() external onlyOwner nonReentrant {
        if (standingsSubmitted) revert AlreadySubmitted();
        if (block.timestamp < endTime + EMERGENCY_DELAY) revert TooEarly();
        uint256 aBal = aUsdt.balanceOf(address(this));
        if (aBal > 0) {
            aavePool.withdraw(address(usdt), aBal, address(this));
        }
        uint256 bal = usdt.balanceOf(address(this));
        usdt.safeTransfer(owner(), bal);
        emit EmergencyWithdraw(owner(), bal);
    }
}
