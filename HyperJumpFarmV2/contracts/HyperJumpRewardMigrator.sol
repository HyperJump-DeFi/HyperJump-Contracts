// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./HyperJumpToken.sol";
import "./OldFarmToken.sol";
import "./IHyperJumpTokenDistributor.sol";

contract HyperJumpRewardMigrator is Ownable {
  OldFarmToken public oldRewardToken;
  HyperJumpToken public hyperJumpToken;
  IHyperJumpTokenDistributor public hyperJumpTokenDistributor;

  uint256 public conversionRatio;

  event Migrated(
    address indexed user,
    uint256 old_amount,
    uint256 new_amount,
    uint256 timestamp
  );

  constructor(
    HyperJumpToken _hyperJumpToken,
    OldFarmToken _oldRewardToken,
    uint256 _conversionRatio,
    IHyperJumpTokenDistributor _hyperJumpTokenDistributor
  ) {
    hyperJumpToken = _hyperJumpToken;
    oldRewardToken = _oldRewardToken;
    conversionRatio = _conversionRatio;
    hyperJumpTokenDistributor = _hyperJumpTokenDistributor;
  }

  /// @notice Exchange OLD reward token for NEW
  function migrateRewardToken() public {
    uint256 _amount = oldRewardToken.balanceOf(address(msg.sender));
    oldRewardToken.burnFrom(payable(msg.sender), _amount);
    uint256 amountAfterRatio = _amount / conversionRatio;
    hyperJumpTokenDistributor.collectTo(payable(msg.sender), amountAfterRatio);
    emit Migrated(msg.sender, _amount, amountAfterRatio, block.timestamp);
  }
}
