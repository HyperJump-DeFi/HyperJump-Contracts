// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.6.2;

interface ISynapseBridge {
  function deposit(address to, uint256 chainId, address token, uint256 amount) external;
  function redeem(address to, uint256 chainId, address token, uint256 amount) external;
}
