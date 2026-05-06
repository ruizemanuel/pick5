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
