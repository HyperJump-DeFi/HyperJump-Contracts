// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./FarmActionInitiators.sol";
import "./IHyperswapBreakLP.sol";
import "./IHyperswapPair.sol";
import "./IHyperJumpTokenDistributor.sol";

import "hardhat/console.sol";

contract HyperJumpStation is Ownable, ReentrancyGuard, FarmActionInitiators {
  using SafeERC20 for IERC20;

  uint256 public TRANSACTION_DEADLINE = 20 * 60 * 1000; // 20 minutes transaction deadline (same default as in UI)

  // Info of each user.
  struct UserInfo {
    uint256 amount; // How many tokens the user has provided.
    uint256 rewardDebt; // Reward debt. See explanation below.
    uint256 tradeAmount;
    uint256 tradeRewardDebt;
    //
    // We do some fancy math here. Basically, any point in time, the amount of ALLOY
    // entitled to a user but is pending to be distributed is:
    //
    //  pending reward = (user.amount * pool.accRewardPerShare) - user.rewardDebt
    //
    // Whenever a user deposits or withdraws tokens to a pool. Here's what happens:
    //   1. The pool's `accRewardPerShare` (and `lastRewardTime`) gets updated.
    //   2. User receives the pending reward sent to his/her address.
    //   3. User's `amount` gets updated.
    //   4. User's `rewardDebt` gets updated.
  }
  // Info of each user that stakes tokens.
  mapping(uint256 => mapping(address => UserInfo)) public userInfo;

  // Info of each pool.
  struct PoolInfo {
    address token; // Address of staked token contract.
    uint256 totalTradeAmount; // the total of user trade amounts
    uint256 totalTradeAmountFloor; // the total of user trade amounts when last claimed
    uint256 allocPoint; // How many allocation points assigned to this pool. reward token to distribute per second.
    uint256 lastRewardTime; // Last timestamp that reward distribution occured.
    uint256 accRewardPerShare; // Accumulated reward per share, times claimable_precision. See below.
    uint256 accRewardPerTrade; // Accumulated reward per trade, times claimable_precision. See below.
    uint256 startTime; // first time when the pool starts emitting rewards
    uint256 endTime; // last time when the pool emits rewards
    uint256 claimable_precision; // claimable precision which is 1e12 for a token with 18 decimals, it is 1e24 for a token with 6 decimals and 1e30 for a token with no decimals
  }
  // Info of each pool.
  PoolInfo[] public poolInfo;
  // Total allocation points. Must be the sum of all allocation points in all pools.
  uint256 public totalAllocPoint = 0;

  // Info of each emission receiver.
  struct ReceiverInfo {
    address receiver; // Address of receiver contract.
    uint256 percentage; // percentage of emission assigned to this receiver.
  }
  // List of emission receivers.
  ReceiverInfo[] public receiverInfo;
  // Total distribution points. Must be the sum of all distribution points in all pools.
  uint256 public totalRecieverPercentage = 0;

  IERC20 public hyperJumpToken;
  IHyperJumpTokenDistributor public hyperJumpTokenDistributor;

  // farm parameters
  uint256 public emission_per_second; // emission per second. bsc = 3 sec/block ftm = 1 sec/block
  uint256 public minFarmEmissionPercentage;
  uint256 public tradeEmissionPercentage;

  // pair corresponding pid
  mapping(address => uint256) public pidByPair;

  // routers which are allowed to mint
  mapping(address => bool) public swapminter;
  // routers for LP token
  mapping(address => address) public lpRouter;

  address public burn_contract;

  event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
  event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
  event EmergencyWithdraw(
    address indexed user,
    uint256 indexed pid,
    uint256 amount
  );

  event DepositFor(
    address indexed user,
    uint256 indexed pid,
    uint256 amount,
    address indexed ultimateBeneficialOwner
  );
  event WithdrawFor(
    address indexed user,
    uint256 indexed pid,
    uint256 amount,
    address indexed ultimateBeneficialOwner
  );
  event EmergencyWithdrawFor(
    address indexed user,
    uint256 indexed pid,
    uint256 amount,
    address indexed ultimateBeneficialOwner
  );
  event BreakLpFor(
    address indexed user,
    uint256 indexed pid,
    uint256 amount,
    address indexed ultimateBeneficialOwner
  );

  event Claimed(
    address indexed user,
    uint256 indexed pid,
    uint256 amount,
    uint256 timestamp
  );
  event TradeDeposit(address indexed user, uint256 indexed pid, uint256 amount);
  event SyncedEmission(uint256 timestamp, uint256 amount, uint256 seconds_in_period);

  function initStation(
    IERC20 _hyperJumpToken,
    IHyperJumpTokenDistributor _hyperJumpTokenDistributor,
    uint256 _emission_per_second,
    uint256 _minFarmPercentage,
    uint256 _trade_emission_percentage,
    uint256 _burn_percentage,
    address _burn_contract
  ) external onlyOwner {
    require(address(hyperJumpToken) == address(0), "already initialized!");
    hyperJumpToken = _hyperJumpToken;
    hyperJumpTokenDistributor = _hyperJumpTokenDistributor;
    emission_per_second = _emission_per_second;
    minFarmEmissionPercentage = _minFarmPercentage;
    tradeEmissionPercentage = _trade_emission_percentage;

    // add receiver BURN_CONTRACT = 20% burn percentage as per vote. can be changed later
    burn_contract = _burn_contract;
    addReceiver(_burn_percentage, burn_contract);
  }

  function poolLength() public view returns (uint256) {
    return poolInfo.length;
  }

  function receiverLength() public view returns (uint256) {
    return receiverInfo.length;
  }

  // Add a new lp to the pool. Can only be called by the owner.
  function add(
    uint256 _allocPoint,
    address _token,
    uint256 _start_time,
    uint256 _end_time,
    bool _withUpdate
  ) public onlyOwner {
    if (_withUpdate) {
      massUpdatePools();
    }
    uint256 lastRewardTime = (block.timestamp > _start_time)
      ? block.timestamp
      : _start_time;
    totalAllocPoint = totalAllocPoint + _allocPoint;
    uint256 claimable_precision = 10**(30 - IERC20Metadata(_token).decimals());
    poolInfo.push(
      PoolInfo({
        token: _token,
        totalTradeAmount: 0,
        totalTradeAmountFloor: 0,
        allocPoint: _allocPoint,
        lastRewardTime: lastRewardTime,
        accRewardPerShare: 0,
        accRewardPerTrade: 0,
        startTime: _start_time,
        endTime: _end_time,
        claimable_precision: claimable_precision
      })
    );
    pidByPair[_token] = poolLength() - 1;
  }

  // configure LP router to be able to automate breaking LP on hitting stop loss
  function configureLpRouter(address _lp_token, address _lp_router)
    external
    onlyOwner
  {
    require(lpRouter[_lp_token] == address(0), "LP router already configured!");
    lpRouter[_lp_token] = _lp_router;
    IERC20(_lp_token).approve(_lp_router, type(uint256).max);
  }

  // update the tradeEmissionPercentage
  function updateTradeEmissionPercentage(uint256 _new_percentage) external onlyOwner {
     require(_new_percentage >= 0 && _new_percentage <= 20, "Trade emission percentage outside allowed 0-20% range!");
     massUpdatePools();
     tradeEmissionPercentage = _new_percentage;
  }
  
  // Update the given pool's ALLOY allocation point. Can only be called by the owner.
  function set(
    uint256 _pid,
    uint256 _allocPoint,
    uint256 _start_time,
    uint256 _end_time,
    bool _withUpdate
  ) external onlyOwner {
    if (_withUpdate) {
      massUpdatePools();
    }
    totalAllocPoint = totalAllocPoint - poolInfo[_pid].allocPoint + _allocPoint;
    poolInfo[_pid].allocPoint = _allocPoint;
    poolInfo[_pid].startTime = _start_time;
    poolInfo[_pid].endTime = _end_time;
  }

  /// @dev has a check for dupe receivers. Can only be called by the owner.
  function addReceiver(uint256 _percentage, address _receiver)
    public
    onlyOwner
  {
    require(_percentage > 0, "addReceiver: precentage must be more than 0");
    require(
      totalRecieverPercentage + _percentage + minFarmEmissionPercentage <= 100,
      "addReceiver: percentage exceed 100!!"
    );
    receiverInfo.push(
      ReceiverInfo({ receiver: _receiver, percentage: _percentage })
    );
    totalRecieverPercentage += _percentage;
  }

  // Update the given pool's reward allocation point. Can only be called by the owner.
  function setReceiver(uint256 _rid, uint256 _percentage) external onlyOwner {
    require(
      totalRecieverPercentage -
        receiverInfo[_rid].percentage +
        _percentage +
        minFarmEmissionPercentage <=
        100,
      "addReceiver: percentage too high!"
    );
    totalRecieverPercentage =
      totalRecieverPercentage -
      receiverInfo[_rid].percentage +
      _percentage;
    receiverInfo[_rid].percentage = _percentage;
  }

  // View function to see pending rewards on frontend.
  function pendingReward(uint256 _pid, address _user)
    public
    view
    returns (uint256)
  {
    PoolInfo storage pool = poolInfo[_pid];
    UserInfo storage user = userInfo[_pid][_user];
    uint256 total_staked = IERC20(pool.token).balanceOf(address(this));
    uint256 accumulatedRewardsPerShare = pool.accRewardPerShare;
    uint256 accumulatedRewardsPerTrade = pool.accRewardPerTrade;
    uint256 trades_since_last_claim = pool.totalTradeAmount -
      pool.totalTradeAmountFloor;
    if (block.timestamp > pool.lastRewardTime && total_staked != 0) {
      uint256 nr_of_seconds = getRewardableSeconds(
        pool.lastRewardTime,
        pool.startTime,
        pool.endTime
      );
      uint256 total_emission = (emission_per_second *
        nr_of_seconds *
        pool.allocPoint) / totalAllocPoint;
      uint256 claimable_farm_emission = (total_emission *
        (MAX_PCT - totalRecieverPercentage - tradeEmissionPercentage)) /
        MAX_PCT;
      uint256 claimable_trade_emission = (total_emission *
        tradeEmissionPercentage) / MAX_PCT;
      accumulatedRewardsPerShare =
        accumulatedRewardsPerShare +
        ((claimable_farm_emission * pool.claimable_precision) / total_staked);
      if (trades_since_last_claim != 0) {
        accumulatedRewardsPerTrade =
          accumulatedRewardsPerTrade +
          ((claimable_trade_emission * pool.claimable_precision) /
            trades_since_last_claim);
      }
    }
    uint256 pending_farm = ((user.amount * accumulatedRewardsPerShare) /
      pool.claimable_precision) - user.rewardDebt;
    uint256 pending_trade = ((user.tradeAmount * accumulatedRewardsPerTrade) /
      pool.claimable_precision) - user.tradeRewardDebt;
    return pending_farm + pending_trade;
  }

  // check if pid exists
  function pidExists(uint256 _pid) public view returns (bool) {
    bool exists = 0 <= _pid && _pid < poolLength();
    return exists;
  }

  // Return number of rewardable seconds over the given period.
  function getRewardableSeconds(
    uint256 _from,
    uint256 _start_time,
    uint256 _end_time
  ) public view returns (uint256) {
    uint256 from_time = (_from > _start_time) ? _from : _start_time;
    uint256 to_time = (block.timestamp < _end_time)
      ? block.timestamp
      : _end_time;
    return (from_time <= _end_time) ? to_time - from_time : 0;
  }

  function claimPoolRewards(uint256 _pid) internal {
    require(pidExists(_pid), "handling non-existing pool!");
    PoolInfo storage pool = poolInfo[_pid];
    if (block.timestamp <= pool.lastRewardTime) {
      return;
    }
    uint256 total_staked = IERC20(pool.token).balanceOf(address(this));
    if (total_staked == 0) {
      pool.lastRewardTime = block.timestamp;
      return;
    }
    uint256 nr_of_seconds = getRewardableSeconds(
      pool.lastRewardTime,
      pool.startTime,
      pool.endTime
    );
    uint256 total_emission = (emission_per_second *
      nr_of_seconds *
      pool.allocPoint) / totalAllocPoint;
    uint256 claimable_farm_emission = total_emission;

    // mint to traders
    uint256 trade_rewards = (total_emission * tradeEmissionPercentage) /
      MAX_PCT;
    uint256 trades_since_last_claim = pool.totalTradeAmount -
      pool.totalTradeAmountFloor;
    if (trades_since_last_claim != 0) {
      pool.totalTradeAmountFloor = pool.totalTradeAmount;
      pool.accRewardPerTrade =
        pool.accRewardPerTrade +
        ((trade_rewards * pool.claimable_precision) / trades_since_last_claim);
    } else {
      // we will "collect" to a BurnContract, which will burn via the token's burn function
      // token has a totalBurned method which registers the mount burned, but only when using the burn function
      hyperJumpTokenDistributor.collectTo(burn_contract, trade_rewards);
    }
    claimable_farm_emission = claimable_farm_emission - trade_rewards; // subtract trade reward emission from claimable emission

    // mint to emission receivers
    uint256 numReceivers = receiverLength();
    for (uint256 _rid = 0; _rid < numReceivers; _rid++) {
      uint256 emission_percentage = receiverInfo[_rid].percentage;
      uint256 receiver_reward = (total_emission * emission_percentage) /
        MAX_PCT;
      hyperJumpTokenDistributor.collectTo(
        payable(receiverInfo[_rid].receiver),
        receiver_reward
      ); // Mint to receiver address.
      claimable_farm_emission = claimable_farm_emission - receiver_reward; // subtract receiver emission from claimable emission
    }

    // mint claimable emission to farm
    uint256 need_to_mint = claimable_farm_emission + trade_rewards;
    hyperJumpTokenDistributor.collectTo(payable(address(this)), need_to_mint);
    pool.accRewardPerShare =
      pool.accRewardPerShare +
      ((claimable_farm_emission * pool.claimable_precision) / total_staked);
    pool.lastRewardTime = block.timestamp;
  }

  function transferClaimableRewards(
    uint256 _pid,
    address _ultimateBeneficialOwner
  ) internal {
    PoolInfo storage pool = poolInfo[_pid];
    UserInfo storage user = userInfo[_pid][_ultimateBeneficialOwner];
    if (user.amount > 0) {
      uint256 claimable_farm_rewards = ((user.amount *
        poolInfo[_pid].accRewardPerShare) / pool.claimable_precision) -
        user.rewardDebt;
      uint256 claimable_trade_rewards = ((user.tradeAmount *
        poolInfo[_pid].accRewardPerTrade) / pool.claimable_precision) -
        user.tradeRewardDebt;
      uint256 claimable = claimable_farm_rewards + claimable_trade_rewards;
      if (claimable > 0) {
        // Check available rewards, just in case if rounding error causes pool to not have enough balance.
        uint256 available_rewards = hyperJumpToken.balanceOf(address(this));
        uint256 claiming = (claimable < available_rewards)
          ? claimable
          : available_rewards;
        hyperJumpToken.transfer(address(_ultimateBeneficialOwner), claiming);
        emit Claimed(_ultimateBeneficialOwner, _pid, claiming, block.timestamp);
      }
    }
  }

  modifier handlePoolRewards(uint256 _pid, address _ultimateBeneficialOwner) {
    claimPoolRewards(_pid);
    transferClaimableRewards(_pid, _ultimateBeneficialOwner);

    _;

    PoolInfo storage pool = poolInfo[_pid];
    UserInfo storage user = userInfo[_pid][_ultimateBeneficialOwner];
    user.rewardDebt =
      (user.amount * pool.accRewardPerShare) /
      pool.claimable_precision;
    user.tradeRewardDebt =
      (user.tradeAmount * pool.accRewardPerTrade) /
      pool.claimable_precision;
  }

  // Update reward variables for a pool
  function updatePool(uint256 _pid)
    public
    handlePoolRewards(_pid, msg.sender)
  {}

  // Update reward variables for all pools. Be careful of gas spending!
  function massUpdatePools() public {
    uint256 length = poolInfo.length;
    for (uint256 pid = 0; pid < length; ++pid) {
      updatePool(pid);
    }
  }

  // orchestrator can calls syncEmission when the emission changes because of changes in the main distributor's weights
  function syncEmission(uint256 _total_amount, uint256 _seconds_in_period) external onlyOwner {
     massUpdatePools();
     emission_per_second = _total_amount / _seconds_in_period;
     emit SyncedEmission(block.timestamp, _total_amount, _seconds_in_period);
  }

  // internal deposit function
  function internal_deposit(
    uint256 _pid,
    uint256 _amount,
    address _depositor,
    address _ultimateBeneficialOwner
  )
    internal
    handlePoolRewards(_pid, _ultimateBeneficialOwner)
    returns (uint256 tokens_deposited)
  {
    PoolInfo storage pool = poolInfo[_pid];
    UserInfo storage user = userInfo[_pid][address(_ultimateBeneficialOwner)];
    tokens_deposited = 0;
    if (_amount > 0) {
      // do check for deflationary tokens
      uint256 _before = IERC20(pool.token).balanceOf(address(this));
      IERC20(pool.token).transferFrom(
        address(_depositor),
        address(this),
        _amount
      );
      tokens_deposited = IERC20(pool.token).balanceOf(address(this)) - _before;
      user.amount = user.amount + tokens_deposited;
    }
    return tokens_deposited;
  }

  // internal withdraw function
  function internal_withdraw(
    uint256 _pid,
    uint256 _amount,
    address _ultimateBeneficialOwner
  ) internal handlePoolRewards(_pid, _ultimateBeneficialOwner) nonReentrant {
    PoolInfo storage pool = poolInfo[_pid];
    UserInfo storage user = userInfo[_pid][address(_ultimateBeneficialOwner)];
    require(user.amount >= _amount, "Withdraw: amount exceeds balance!");
    if (_amount > 0) {
      user.amount = user.amount - _amount;
      IERC20(pool.token).transfer(address(_ultimateBeneficialOwner), _amount);
    }
  }

  // Withdraw without caring about rewards. EMERGENCY ONLY.
  function internal_emergencyWithdraw(
    uint256 _pid,
    address _ultimateBeneficialOwner
  ) internal nonReentrant returns (uint256 user_amount) {
    PoolInfo storage pool = poolInfo[_pid];
    UserInfo storage user = userInfo[_pid][address(_ultimateBeneficialOwner)];
    user_amount = user.amount;
    IERC20(pool.token).transfer(address(_ultimateBeneficialOwner), user.amount);
    user.amount = 0;
    user.rewardDebt = 0;
    return user_amount;
  }

  // internal break LP function
  function internal_break_LP(
    uint256 _pid,
    uint256 _amount,
    address _initiator,
    address _ultimateBeneficialOwner
  ) internal handlePoolRewards(_pid, _ultimateBeneficialOwner) nonReentrant {
    console.log("internal_break_LP called");
    PoolInfo storage pool = poolInfo[_pid];
    require(
      lpRouter[pool.token] != address(0),
      "No router configured to break LP!"
    );
    UserInfo storage user = userInfo[_pid][address(_ultimateBeneficialOwner)];
    require(user.amount >= _amount, "Break LP: amount exceeds balance!");
    if (_amount > 0) {
      user.amount = user.amount - _amount;
      uint256 fee = calculateBreakLpFee(_initiator, _amount);
      UserInfo storage break_lp_fee_receiver = userInfo[_pid][
        break_lp_fee_wallet
      ];
      break_lp_fee_receiver.amount += fee;
      uint256 lp_to_break = _amount - fee;
      address token0 = IHyperswapPair(pool.token).token0();
      address token1 = IHyperswapPair(pool.token).token1();
      address ubo = _ultimateBeneficialOwner;
      uint256 deadline = block.timestamp + TRANSACTION_DEADLINE;
      IHyperswapBreakLP(lpRouter[pool.token]).removeLiquidity(
        token0,
        token1,
        lp_to_break,
        0,
        0,
        ubo,
        deadline
      );
    }
  }

  // Deposit tokens
  function deposit(uint256 _pid, uint256 _amount) external nonReentrant {
    uint256 _tokens_deposited = internal_deposit(
      _pid,
      _amount,
      msg.sender,
      msg.sender
    );
    emit Deposit(msg.sender, _pid, _tokens_deposited);
  }

  // Withdraw tokens
  function withdraw(uint256 _pid, uint256 _amount) external {
    internal_withdraw(_pid, _amount, msg.sender);
    emit Withdraw(msg.sender, _pid, _amount);
  }

  // Deposit for someone else
  function depositFor(
    uint256 _pid,
    uint256 _amount,
    address _ultimateBeneficialOwner
  ) external nonReentrant {
    uint256 _tokens_deposited = internal_deposit(
      _pid,
      _amount,
      msg.sender,
      _ultimateBeneficialOwner
    );
    emit DepositFor(
      msg.sender,
      _pid,
      _tokens_deposited,
      _ultimateBeneficialOwner
    );
  }

  // Initiate withdraw tokens for someone else (funds are never transfered to the initiator, but always to the ultimate beneficial owner)
  function withdrawFor(
    uint256 _pid,
    uint256 _amount,
    address _ultimateBeneficialOwner
  ) external onlyWithdrawInitiator(_ultimateBeneficialOwner) {
    internal_withdraw(_pid, _amount, _ultimateBeneficialOwner);
    emit WithdrawFor(msg.sender, _pid, _amount, _ultimateBeneficialOwner);
  }

  // Withdraw without caring about rewards. EMERGENCY ONLY.
  function emergencyWithdraw(uint256 _pid) external {
    uint256 _user_amount = internal_emergencyWithdraw(_pid, msg.sender);
    emit EmergencyWithdraw(msg.sender, _pid, _user_amount);
  }

  // Initiate withdraw and break LP tokens for someone else (funds are never transfered to the initiator, but always to the ultimate beneficial owner)
  function breakLpFor(
    uint256 _pid,
    uint256 _amount,
    address _ultimateBeneficialOwner
  ) external onlyBreakLpInitiator(_ultimateBeneficialOwner) {
    internal_break_LP(_pid, _amount, msg.sender, _ultimateBeneficialOwner);
    emit BreakLpFor(msg.sender, _pid, _amount, _ultimateBeneficialOwner);
  }

  // Initiate emergencyWithdraw without caring about rewards for someone else. EMERGENCY ONLY. (funds are never transfered to the initiator, but always to the ultimate beneficial owner)
  function emergencyWithdrawFor(uint256 _pid, address _ultimateBeneficialOwner)
    external
    onlyEmergencyWithdrawInitiator(_ultimateBeneficialOwner)
  {
    uint256 _user_amount = internal_emergencyWithdraw(
      _pid,
      _ultimateBeneficialOwner
    );
    emit EmergencyWithdrawFor(
      msg.sender,
      _pid,
      _user_amount,
      _ultimateBeneficialOwner
    );
  }

  function setSwapMinterAllowed(address _router, bool _allowed)
    external
    onlyOwner
  {
    swapminter[_router] = _allowed;
  }

  function swapMint(
    address _user,
    address _pair,
    uint256 _amount
  ) external {
    if (!swapminter[_msgSender()]) return;
    uint256 pid = pidByPair[_pair];
    if (pid == 0 || _amount == 0) return;
    PoolInfo storage pool = poolInfo[pid];
    UserInfo storage user = userInfo[pid][_user];
    pool.totalTradeAmount = pool.totalTradeAmount + _amount;
    user.tradeAmount = user.tradeAmount + _amount;
  }

  // end of contract
}
