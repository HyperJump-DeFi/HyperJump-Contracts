// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./IHyperJumpTokenDistributor.sol";

contract HyperJumpFtmClaimLpRewards is Ownable {
  mapping (address => uint256) public amounts;
  mapping (address => bool) public claimed;
  IHyperJumpTokenDistributor public hyperJumpTokenDistributor;

  event Claimed(
    address indexed user,
    uint256 amount,
    uint256 timestamp
  );

  constructor(IHyperJumpTokenDistributor _hyperJumpTokenDistributor) {
    hyperJumpTokenDistributor = _hyperJumpTokenDistributor;
  }
  
  function setClaims(address[] calldata _users, uint256[] calldata _amounts) external onlyOwner {
     require(_users.length == _amounts.length, "input size mismatch");
     for (uint256 n=0; n< _users.length; n++) {
        amounts[_users[n]] = _amounts[n];
     }
  }
   
  function claim() external {
    require(!claimed[msg.sender], "already claimed");
    require(amounts[msg.sender] > 0, "not claimable");
    hyperJumpTokenDistributor.collectTo(msg.sender, amounts[msg.sender]);
    claimed[msg.sender] = true;
    emit Claimed(msg.sender, amounts[msg.sender], block.timestamp);
  }

  function canClaim() external view returns (bool) {
    return amounts[msg.sender] > 0
           && !claimed[msg.sender];
  }

}