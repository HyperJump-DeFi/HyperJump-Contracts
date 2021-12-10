// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./HyperJumpToken.sol";
import "./IHyperJumpTokenDistributor.sol";

// And then, of course, I've got this terrible pain in all the diodes down my left side.
contract HyperJumpMechJunkYard {
  IERC20 public oldMechToken;
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
    IERC20 _oldMechToken,
    uint256 _conversionRatio,
    IHyperJumpTokenDistributor _hyperJumpTokenDistributor
  ) {
    hyperJumpToken = _hyperJumpToken;
    oldMechToken = _oldMechToken;
    conversionRatio = _conversionRatio;
    hyperJumpTokenDistributor = _hyperJumpTokenDistributor;
  }

  /// @notice Exchange OLD reward token for NEW
  function migrateMechToken() public {
    uint256 _amount = oldMechToken.balanceOf(address(msg.sender));
    oldMechToken.transferFrom(msg.sender, address(this), _amount);
    uint256 amountAfterRatio = _amount / conversionRatio;
    hyperJumpTokenDistributor.collectTo(payable(msg.sender), amountAfterRatio);
    emit Migrated(msg.sender, _amount, amountAfterRatio, block.timestamp);
  }
}
