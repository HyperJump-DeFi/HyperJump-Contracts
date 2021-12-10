// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IHyperJumpTokenDistributor {
  function hyperJumpToken() external view returns (address);

  function hyperJumpToken_collector() external view returns (address);

  function collect(uint256 _amount) external;

  function collectTo(address _destination, uint256 _amount) external;

  function collected() external view returns (uint256);

  function availableInDistributor() external view returns (uint256);

  function availableInCollector() external view returns (uint256);
}
