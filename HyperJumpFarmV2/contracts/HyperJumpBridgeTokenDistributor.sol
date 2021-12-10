// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./HyperJumpSimpleTokenDistributor.sol";
import "./ISynapseBridge.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract HyperJumpBridgeTokenDistributor is HyperJumpSimpleTokenDistributor {
  bool public bridge_receiver = false;
  address public bridge;
  address public destination_address;
  uint256 public destination_chainId;

  uint256 public distributed = 0;
  uint256 public returned = 0;

  event DistributedToBridge(
    address indexed distributor,
    address indexed bridge,
    uint256 amount,
    uint256 indexed timestamp
  );
  event ReturnedToBridge(
    address indexed distributor,
    address indexed bridge,
    uint256 amount,
    uint256 indexed timestamp
  );

  function setupBridge(
    address _hyperJumpToken,
    address _hyperJumpToken_collector,
    address _bridge,
    bool _bridge_receiver,
    address _destination_address,
    uint256 _destination_chainId
  ) public onlyOwner {
    HyperJumpSimpleTokenDistributor.initialize(
      _hyperJumpToken,
      _hyperJumpToken_collector
    );
    bridge = _bridge;
    bridge_receiver = _bridge_receiver;
    destination_address = _destination_address;
    destination_chainId = _destination_chainId;
  }

  function sendToBridge(uint256 _amount) public onlyOwner {
    if (!bridge_receiver) {
      // distribute via bridge to child chain
      IERC20(hyperJumpToken).approve(bridge, _amount);
      ISynapseBridge(bridge).deposit(destination_address, destination_chainId, hyperJumpToken, _amount);
      distributed += _amount;
      emit DistributedToBridge(address(this), bridge, _amount, block.timestamp);
    } else {
      // return via bridge to main chain
      IERC20(hyperJumpToken).approve(bridge, _amount);
      ISynapseBridge(bridge).redeem(destination_address, destination_chainId, hyperJumpToken, _amount);
      returned += _amount;
      emit ReturnedToBridge(address(this), bridge, _amount, block.timestamp);
    }
  }
}
