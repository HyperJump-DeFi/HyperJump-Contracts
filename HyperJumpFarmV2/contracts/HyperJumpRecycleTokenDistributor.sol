// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./HyperJumpSimpleTokenDistributor.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract HyperJumpRecycleTokenDistributor is HyperJumpSimpleTokenDistributor {
  address public destination_address;

  uint256 public returned = 0;

  event ReturnedToMainDistributor(
    address indexed distributor,
    address indexed mainDistributor,
    uint256 amount,
    uint256 indexed timestamp
  );

  function setupRecycler(
    address _hyperJumpToken,
    address _hyperJumpToken_collector,
    address _destination_address
  ) public onlyOwner {
    HyperJumpSimpleTokenDistributor.initialize(
      _hyperJumpToken,
      _hyperJumpToken_collector
    );
    destination_address = _destination_address;
  }

  function sendToMainDistributor(uint256 _amount) public onlyOwner {
    IERC20(hyperJumpToken).transfer(destination_address, _amount);
    returned += _amount;
    emit ReturnedToMainDistributor(address(this), destination_address, _amount, block.timestamp);
  }
}
