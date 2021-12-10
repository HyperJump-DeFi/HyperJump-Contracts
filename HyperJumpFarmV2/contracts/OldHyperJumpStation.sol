// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";

import "hardhat/console.sol";

contract OldHyperJumpStation is Ownable {
  // Info of each user.
  struct UserInfo {
    uint256 amount; // How many tokens the user has provided.
    uint256 rewardDebt; // Reward debt. See explanation below.
  }
  // Info of each user that stakes tokens.
  mapping(uint256 => mapping(address => UserInfo)) public userInfo;

  // Info of each pool.
  struct PoolInfo {
    address lpToken; // Address of staked token contract.
    uint256 allocPoint; // How many allocation points assigned to this pool. reward token to distribute per second.
    uint256 lastRewardBlock; // Last block that reward distribution occured.
    uint256 accRewardPerShare; // Accumulated reward per share, times claimable_precision. See below.
  }
  // Info of each pool.
  PoolInfo[] public poolInfo;
  // Total allocation points. Must be the sum of all allocation points in all pools.
  uint256 public totalAllocPoint = 0;

  function poolLength() public view returns (uint256) {
    return poolInfo.length;
  }

  event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
}