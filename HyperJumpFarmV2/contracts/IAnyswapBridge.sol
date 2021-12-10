// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.6.2;

interface IAnyswapBridge {
  function Swapout(uint256 amount, address bindaddr) external returns (bool);
}
