// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract HyperJumpSimpleTokenDistributor is Ownable {
  bool public initialized = false;

  address public hyperJumpToken;
  address public hyperJumpToken_collector;

  uint256 public collected = 0;

  event Collected(
    address indexed distributor,
    address indexed collector,
    uint256 amount,
    uint256 indexed timestamp
  );
  
  event ValueReceived(
    address indexed sender,
    uint256 amount
  );

  event ValueCollected(
    address indexed collector,
    uint256 amount
  );

  function initialize(
    address _hyperJumpToken,
    address _hyperJumpToken_collector
  ) public onlyOwner {
    require(
      !initialized,
      "HyperJump token Distributor has already been initialized!"
    );
    initialized = true;
    hyperJumpToken = _hyperJumpToken;
    hyperJumpToken_collector = _hyperJumpToken_collector;
  }

  function collect(uint256 _amount) public {
    collectTo(msg.sender, _amount);
  }

  function collectTo(address _destination, uint256 _amount) public {
    require(
      msg.sender == hyperJumpToken_collector,
      "Only collector may collect JUMPs."
    );
    IERC20(hyperJumpToken).transfer(_destination, _amount);
    collected += _amount;
    emit Collected(address(this), _destination, _amount, block.timestamp);
  }

  function availableInDistributor() public view returns (uint256) {
    return IERC20(hyperJumpToken).balanceOf(address(this));
  }

  function availableInCollector() public view returns (uint256) {
    return IERC20(hyperJumpToken).balanceOf(hyperJumpToken_collector);
  }

  // receive payment fallback
  receive() external payable {
    emit ValueReceived(msg.sender, msg.value);
  }
  
  // collect received payment
  function collectPayments() external onlyOwner {
    uint256 amount = address(this).balance;
    payable(msg.sender).transfer(amount);
    emit ValueCollected(msg.sender, amount); 
  }
  
}
