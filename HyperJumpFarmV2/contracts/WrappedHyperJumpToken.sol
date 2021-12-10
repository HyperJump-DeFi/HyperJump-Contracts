// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./HyperJumpStation.sol";

contract WrappedHyperJumpToken is Ownable, ERC20("Wrapped HyperJump Token", "xJUMP") {  
  address public hyperJumpToken;
  address public farm;
  uint256 public pid;

  function initWrappedHyperJumpToken(address _jump, address _farm, uint256 _pid) public onlyOwner {
     require(hyperJumpToken == address(0), "Wrapped HyperJumpToken already configured!");
     hyperJumpToken = _jump;
     farm = _farm;
     pid = _pid;
  }

  function wrap(uint256 _amount) public {
     require(IERC20(hyperJumpToken).allowance(_msgSender(), address(this)) >= _amount, "Not allowed to transfer JUMP!");
     require(IERC20(hyperJumpToken).balanceOf(_msgSender()) >= _amount, "Not enough JUMP balance available!");
     IERC20(hyperJumpToken).transferFrom(_msgSender(), address(this), _amount);
     _mint(_msgSender(), _amount);
  }

  function unwrap(uint256 _amount) public {
    _burn(_msgSender(), _amount);
    IERC20(hyperJumpToken).transfer(_msgSender(), _amount);
  }
 
  function deposit(uint256 _amount) public {
     require(IERC20(hyperJumpToken).allowance(_msgSender(), address(this)) >= _amount, "Not allowed to transfer JUMP!");
     require(IERC20(hyperJumpToken).balanceOf(_msgSender()) >= _amount, "Not enough JUMP balance available!");
     IERC20(hyperJumpToken).transferFrom(_msgSender(), address(this), _amount);
     _mint(address(this), _amount);
     IERC20(this).approve(farm, _amount);
     HyperJumpStation(farm).depositFor(pid, _amount, _msgSender());
  }

  function withdraw(uint256 _amount) public {
     HyperJumpStation(farm).withdrawFor(pid, _amount, _msgSender());
     _burn(_msgSender(), _amount);
     IERC20(hyperJumpToken).transfer(_msgSender(), _amount);
  }

}
