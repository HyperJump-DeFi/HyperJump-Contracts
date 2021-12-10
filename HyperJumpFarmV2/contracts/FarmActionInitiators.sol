// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";

contract FarmActionInitiators is Ownable {
  uint256 public DEFAULT_BREAK_LP_FEE = 25; // default break LP fee 0.25%
  uint256 public MAX_BREAK_LP_FEE = 100; // max break LP fee     1.00%
  uint256 public MAX_PCT = 10000; // max percentage is  100.00%

  // contracts/wallets which are allowed to initiate a withdraw on behalf of someone (funds are never transfered to the initiator, but always to the ultimate beneficial owner)
  mapping(address => mapping(address => bool)) public withdrawInitiator;
  // contracts/wallets which are allowed to initiate an emergencyWithdraw on behalf of someone (funds are never transfered to the initiator, but always to the ultimate beneficial owner)
  mapping(address => mapping(address => bool))
    public emergencyWithdrawInitiator;
  // contracts/wallets which are allowed to initiate a withdraw and break LP on behalf of someone (funds are never transfered to the initiator, but always to the ultimate beneficial owner)
  mapping(address => mapping(address => bool)) public breakLpInitiator;

  mapping(address => uint256) public breakLpFee;

  address public break_lp_fee_wallet;

  modifier onlyWithdrawInitiator(address _ultimateBeneficialOwner) {
    require(
      withdrawInitiator[msg.sender][_ultimateBeneficialOwner],
      "Need permission to initiate withdraw on behalf of someone else!"
    );
    _;
  }

  function registerWithdrawInitiator(address _initiator, bool _allowed) public {
    withdrawInitiator[_initiator][msg.sender] = _allowed;
  }

  modifier onlyEmergencyWithdrawInitiator(address _ultimateBeneficialOwner) {
    require(
      emergencyWithdrawInitiator[msg.sender][_ultimateBeneficialOwner],
      "Need permission to initiate emergencyWithdraw on behalf of someone else!"
    );
    _;
  }

  function registerEmergencyWithdrawInitiator(address _initiator, bool _allowed)
    external
  {
    emergencyWithdrawInitiator[_initiator][msg.sender] = _allowed;
  }

  modifier onlyBreakLpInitiator(address _ultimateBeneficialOwner) {
    require(
      breakLpInitiator[msg.sender][_ultimateBeneficialOwner],
      "Need permission to initiate withdraw and break LP on behalf of someone else!"
    );
    _;
  }

  function registerBreakLpInitiator(address _initiator, bool _allowed) public {
    breakLpInitiator[_initiator][msg.sender] = _allowed;
    if (breakLpFee[_initiator] == 0) {
      breakLpFee[_initiator] = DEFAULT_BREAK_LP_FEE;
    }
  }

  function registerBreakLpFeeWallet(address _break_lp_fee_wallet)
    external
    onlyOwner
  {
    break_lp_fee_wallet = _break_lp_fee_wallet;
  }

  function registerBreakLpFee(address _initiator, uint256 _fee_percentage)
    external
    onlyOwner
  {
    require(
      _fee_percentage <= MAX_BREAK_LP_FEE,
      "Break LP fee should not exceed 1% !"
    );
    breakLpFee[_initiator] = _fee_percentage;
  }

  function registerZapContract(address _zap_contract) public {
     registerWithdrawInitiator(_zap_contract, true);
     registerBreakLpInitiator(_zap_contract, true);
  }
  
  function calculateBreakLpFee(address _initiator, uint256 _amount)
    internal
    view
    returns (uint256)
  {
    return (_amount * breakLpFee[_initiator]) / MAX_PCT;
  }
}
