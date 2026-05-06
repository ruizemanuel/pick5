// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IAavePool {
    function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
}

contract Pick5Pool {
    address public immutable oracle;
    IERC20  public immutable usdt;
    IAavePool public immutable aavePool;
    IERC20  public immutable aUsdt;
    uint256 public immutable lockTime;
    uint256 public immutable endTime;
    uint256 public constant DEPOSIT = 5_000_000;

    constructor(
        address _oracle,
        IERC20 _usdt,
        IAavePool _aavePool,
        IERC20 _aUsdt,
        uint256 _lockTime,
        uint256 _endTime
    ) {
        require(_oracle != address(0), "zero oracle");
        require(_lockTime < _endTime, "bad times");
        oracle = _oracle;
        usdt = _usdt;
        aavePool = _aavePool;
        aUsdt = _aUsdt;
        lockTime = _lockTime;
        endTime = _endTime;
    }
}
