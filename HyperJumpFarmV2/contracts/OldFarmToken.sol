// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract OldFarmToken is Ownable, ERC20("OldFarmToken", "OLD") {
  constructor(uint256 _initialSupply) {
    mint(address(msg.sender), _initialSupply);
  }

  // burn counter
  uint256 private _burnTotal;

  /// @notice Creates `_amount` token to `_to`. Must only be called by the owner.
  function mint(address _to, uint256 _amount) public onlyOwner {
    _mint(_to, _amount);
  }

  // burn logic
  function burn(uint256 amount) public {
    _burn(_msgSender(), amount);
    _burnTotal = _burnTotal + amount;
  }

  // interactive burn logic
  function burnFrom(address account, uint256 amount) public {
    uint256 decreasedAllowance = allowance(account, _msgSender()) - amount;

    _approve(account, _msgSender(), decreasedAllowance);
    _burn(account, amount);
    _burnTotal = _burnTotal + amount;
  }

  // view total burnt alloy
  function totalBurned() public view returns (uint256) {
    return _burnTotal;
  }
}
