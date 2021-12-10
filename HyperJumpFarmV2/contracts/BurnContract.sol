// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./HyperJumpToken.sol";

contract BurnContract is Ownable {
  HyperJumpToken public hyperJumpToken;

  function setToken(address _hyperJumpToken) public onlyOwner {
    require(address(hyperJumpToken) == address(0), "BurnContract has already been initialized!");
    hyperJumpToken = HyperJumpToken(_hyperJumpToken);
  }

  // available to burn
  function available() public view returns (uint256) {
    return hyperJumpToken.balanceOf(address(this));
  }

  // burn
  function burn(uint256 _amount) public onlyOwner {
    hyperJumpToken.burn(_amount);
  }

  // burn ALL!
  function burnAll() public onlyOwner {
    hyperJumpToken.burn(hyperJumpToken.balanceOf(address(this)));
  }

  // total burned
  function totalBurned() public view returns (uint256) {
    return hyperJumpToken.totalBurned();
  }
}
