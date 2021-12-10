// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./HyperJumpToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract HyperJumpMainDistributor is Ownable {
  bool public initialized = false;

  struct ChainDistributorConfig {
    address distributor;
    uint256 weight;
    string name;
  }
  ChainDistributorConfig[] public chainDistributor;
  uint256 public nr_of_chain_distributors = 0;
  uint256 public total_weight = 0;

  address public hyperJumpToken;
  uint256 public emission_start;
  uint256 public emission_total_period;
  uint256 public emission_time_unit;
  uint256 public emission_total_time_units;
  uint256 public emission_total_tokens;
  uint256 public last_emission;

  event AddChain(uint256 indexed chain_index, address indexed distributor, uint256 weight, string name, uint256 indexed timestamp);
  event UpdateWeight(uint256 indexed chain_index, uint256 weight, uint256 indexed timestamp);
  event Distributed(uint256 indexed chain_index, uint256 amount, uint256 indexed timestamp);

  function initialize(
    address _hyperJumpToken,
    uint256 _emission_start,
    uint256 _emission_total_period,
    uint256 _emission_time_unit,
    uint256 _emission_total_tokens
  ) public onlyOwner {
    require(!initialized, "HyperJumpMainDistributor has already been initialized!");
    initialized = true;
    hyperJumpToken = _hyperJumpToken;
    emission_start = _emission_start;
    emission_total_period = _emission_total_period;
    emission_time_unit = _emission_time_unit;
    emission_total_time_units = _emission_total_period / _emission_time_unit;
    emission_total_tokens = _emission_total_tokens;
    last_emission = _emission_start - emission_time_unit;
  }

  function addChainDistributor(address _distributor, uint256 _weight, string memory _name) public onlyOwner {
    chainDistributor.push(
      ChainDistributorConfig({
        distributor: _distributor,
        weight: _weight,
        name: _name
      })
    );
    total_weight = total_weight + _weight;
    emit AddChain(nr_of_chain_distributors, _distributor, _weight, _name, block.timestamp);
    nr_of_chain_distributors++;
  }

  function updateDistributionWeights(uint256[] memory _weights) public onlyOwner {
    require(_weights.length == nr_of_chain_distributors, "Can only update all weights at the same time!");
    total_weight = 0;
    for (uint256 chain_index = 0; chain_index < nr_of_chain_distributors; chain_index++) {
      ChainDistributorConfig storage distributorConfig = chainDistributor[chain_index];
      uint256 weight = _weights[chain_index];
      distributorConfig.weight = weight;
      total_weight += weight;
      emit UpdateWeight(chain_index, weight, block.timestamp);
    }
  }

  function availableInMainDistributor() public view returns (uint256) {
    return IERC20(hyperJumpToken).balanceOf(address(this));
  }

  function availableInDistributor(uint256 _chain_index) public view returns (uint256) {
    require(_chain_index < nr_of_chain_distributors, "Outside of chain distributor index range!");
    return IERC20(hyperJumpToken).balanceOf(chainDistributor[_chain_index].distributor);
  }

  function distribute() public onlyOwner {
    if (block.timestamp < emission_start) return;
    uint256 time_passed = block.timestamp - last_emission;
    uint256 time_units_passed = time_passed / emission_time_unit;
    if (time_units_passed == 0) return;
    uint256 to_distribute = (emission_total_tokens * time_units_passed) / emission_total_time_units;
    for (uint256 chain_index = 0; chain_index < nr_of_chain_distributors; chain_index++) {
      ChainDistributorConfig storage distributorConfig = chainDistributor[chain_index];
      uint256 amount_to_distribute_to_chain = (to_distribute * distributorConfig.weight) / total_weight;
      IERC20(hyperJumpToken).transfer(distributorConfig.distributor, amount_to_distribute_to_chain);
      emit Distributed(chain_index, amount_to_distribute_to_chain, block.timestamp);
    }
    last_emission = last_emission + time_units_passed * emission_time_unit;
  }
}
