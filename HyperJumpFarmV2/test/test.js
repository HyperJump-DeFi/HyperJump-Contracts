const { BN } = require("@openzeppelin/test-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

// vars
const initialSupply = new BN(1000);
const totalJumpSupply = new BN("250000000000000000000000000");

const contractName = "HyperJumpToken";
const name = "HyperJump";
const symbol = "JUMP";
const decimals = 18;

const oldName = "OldFarmToken";
const oldSymbol = "OLD";
const oldDecimals = 18;

const farmName = "HyperJumpStation";

const conversionRate = new BN(3);
const rewardPerSecond = 1;
const minimumFarmPercentage = 50;
const tradeEmissionPercentage = 10;
const burnPercentage = 20;
const startTime = new BN(42);
const endTime = new BN(666);
const autoDistribute = true;

const pid0AllocPoint = new BN(10);

const ZERO = new BN(0);

describe("Hyperjump JUMP Token", function () {
  beforeEach(async () => {
    JumpToken = await ethers.getContractFactory(contractName);
    jumpToken = await JumpToken.deploy();
    [owner, addr1, addr2, _] = await ethers.getSigners();
  });

  describe("Deployment of HyperJumpToken", () => {
    it("Should renounce ownership", async () => {
      expect(await jumpToken.owner()).to.equal(
        "0x0000000000000000000000000000000000000000"
      );
    });

    it("Should assign initialSupply balance to the owner", async () => {
      const ownerBalance = await jumpToken.balanceOf(owner.address);
      expect(await jumpToken.totalSupply()).to.equal(ownerBalance);
      expect((await jumpToken.totalSupply()).toString()).to.equal(
        totalJumpSupply.toString()
      );
    });
  });

  describe("HyperJumpToken decimals, name and symbol", () => {
    it("Should have the right details", async () => {
      expect(await jumpToken.symbol()).to.equal("JUMP");
      expect(await jumpToken.name()).to.equal(name);
      expect(await jumpToken.decimals()).to.equal(decimals);
    });
  });

  describe("HyperJumpToken Transactions", () => {
    it("Should transfer tokens between accounts", async () => {
      await jumpToken.transfer(addr1.address, 50);
      const addr1Balance = await jumpToken.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(50);

      await jumpToken.connect(addr1).transfer(addr2.address, 50);
      const addr2Balance = await jumpToken.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(50);
    });

    it("Should fail if sender does not have enough tokens", async () => {
      const initialBalanceOwner = await jumpToken.balanceOf(owner.address);

      expect(
        jumpToken.connect(addr1).transfer(owner.address, 1)
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");

      expect(await jumpToken.balanceOf(owner.address)).to.equal(
        initialBalanceOwner
      );
    });
  });

  describe("RewardToken burn", () => {
    it("Should have totalBurned equal to burned amount", async () => {
      const ownerBalance = await jumpToken.balanceOf(owner.address);

      await jumpToken.burn(ownerBalance);
      expect(await jumpToken.totalBurned()).to.equal(ownerBalance);
    });

    it("Should fail burn if sender does not have enough tokens", async () => {
      expect(jumpToken.connect(addr1).burn(1000)).to.be.revertedWith(
        "ERC20: burn amount exceeds balance"
      );
    });
  });
});

describe("Hyper Station - Farm Token", function () {
  beforeEach(async () => {
    RewardToken = await ethers.getContractFactory("HyperJumpToken");
    rewardToken = await RewardToken.deploy();
    [owner, addr1, addr2, _] = await ethers.getSigners();
  });

  describe("Deployment of RewardToken", () => {
    it("Should set the right owner", async () => {
      expect(await rewardToken.owner()).to.equal(
        "0x0000000000000000000000000000000000000000"
      );
    });

    it("Should assign initialSupply balance to the owner", async () => {
      const ownerBalance = await rewardToken.balanceOf(owner.address);
      expect(await rewardToken.totalSupply()).to.equal(ownerBalance);
    });
  });

  describe("RewardToken decimals, name and symbol", () => {
    it("Should have the right datails", async () => {
      expect(await rewardToken.symbol()).to.equal(symbol);
      expect(await rewardToken.name()).to.equal(name);
      expect(await rewardToken.decimals()).to.equal(decimals);
    });
  });

  describe("RewardToken Transactions", () => {
    it("Should transfer tokens between accounts", async () => {
      await rewardToken.transfer(addr1.address, 50);
      const addr1Balance = await rewardToken.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(50);

      await rewardToken.connect(addr1).transfer(addr2.address, 50);
      const addr2Balance = await rewardToken.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(50);
    });

    it("Should fail if sender does not have enough tokens", async () => {
      const initialBalanceOwner = await rewardToken.balanceOf(owner.address);

      expect(
        rewardToken.connect(addr1).transfer(owner.address, 1)
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");

      expect(await rewardToken.balanceOf(owner.address)).to.equal(
        initialBalanceOwner
      );
    });
  });

  describe("RewardToken burn", () => {
    it("Should have totalBurned equal to burned amount", async () => {
      const ownerBalance = await rewardToken.balanceOf(owner.address);

      await rewardToken.burn(ownerBalance);
      expect(await rewardToken.totalBurned()).to.equal(ownerBalance);
    });

    it("Should fail burn if sender does not have enough tokens", async () => {
      expect(rewardToken.connect(addr1).burn(1000)).to.be.revertedWith(
        "ERC20: burn amount exceeds balance"
      );
    });
  });

  describe("RewardToken mint", () => {
    /*   it("Should  mint if sender is owner", async () => {
      const ownerBalance = await rewardToken.balanceOf(owner.address);
      console.log("owner balance before mint: ", ownerBalance.toString());
      await rewardToken.mint(owner.address, ownerBalance);
      const ownerBalance2 = await rewardToken.balanceOf(owner.address);
      console.log("owner balance after mint: ", ownerBalance2.toString());
      expect(ownerBalance2).to.equal(ownerBalance * 2);
    }); */
    /*  it("Should fail mint if sender is not owner", async () => {
      expect(
        rewardToken.connect(addr1).mint(addr1.address, 1000)
      ).to.be.revertedWith("'Only minter may mint.");
    }); */
  });
});

// test old farm token
describe("HyperCity - Old Farm Token", function () {
  beforeEach(async () => {
    OldRewardToken = await ethers.getContractFactory(oldName);
    oldRewardToken = await OldRewardToken.deploy(initialSupply.toString());
    [owner, addr1, addr2, _] = await ethers.getSigners();
  });

  describe("Deployment of the old RewardToken", () => {
    it("Should set the right owner", async () => {
      expect(await oldRewardToken.owner()).to.equal(owner.address);
    });

    it("Should assign initialSupply balance to the owner", async () => {
      const ownerBalance = await oldRewardToken.balanceOf(owner.address);
      expect(await oldRewardToken.totalSupply()).to.equal(ownerBalance);
    });
  });

  describe("RewardToken decimals, name and symbol", () => {
    it("Should have the right datails", async () => {
      expect(await oldRewardToken.symbol()).to.equal(oldSymbol);
      expect(await oldRewardToken.name()).to.equal(oldName);
      expect(await oldRewardToken.decimals()).to.equal(oldDecimals);
    });
  });

  describe("RewardToken Transactions", () => {
    it("Should transfer tokens between accounts", async () => {
      await oldRewardToken.transfer(addr1.address, 50);
      const addr1Balance = await oldRewardToken.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(50);

      await oldRewardToken.connect(addr1).transfer(addr2.address, 50);
      const addr2Balance = await oldRewardToken.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(50);
    });

    it("Should fail if sender does not have enough tokens", async () => {
      const initialBalanceOwner = await oldRewardToken.balanceOf(owner.address);

      expect(
        oldRewardToken.connect(addr1).transfer(owner.address, 1)
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");

      expect(await oldRewardToken.balanceOf(owner.address)).to.equal(
        initialBalanceOwner
      );
    });
  });

  describe("RewardToken burn", () => {
    it("Should have totalBurned equal to burned amount", async () => {
      const ownerBalance = await oldRewardToken.balanceOf(owner.address);

      await oldRewardToken.burn(ownerBalance);
      expect(await oldRewardToken.totalBurned()).to.equal(ownerBalance);
    });

    it("Should fail burn if sender does not have enough tokens", async () => {
      expect(oldRewardToken.connect(addr1).burn(1000)).to.be.revertedWith(
        "ERC20: burn amount exceeds balance"
      );
    });
  });

  describe("RewardToken mint", () => {
    it("Should  mint if sender is owner", async () => {
      const ownerBalance = await oldRewardToken.balanceOf(owner.address);
      console.log("owner balance before mint: ", ownerBalance.toString());
      await oldRewardToken.mint(owner.address, ownerBalance);
      const ownerBalance2 = await oldRewardToken.balanceOf(owner.address);
      console.log("owner balance after mint: ", ownerBalance2.toString());
      expect(ownerBalance2).to.equal(ownerBalance * 2);
    });

    it("Should fail mint if sender is not owner", async () => {
      expect(
        oldRewardToken.connect(addr1).mint(addr1.address, 1000)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});

// test burn contract
describe("Hyper Farm - BurnContract", function () {
  beforeEach(async () => {
    OldRewardToken = await ethers.getContractFactory(oldName);
    oldRewardToken = await OldRewardToken.deploy(initialSupply.toString());
    [owner, addr1, addr2, _] = await ethers.getSigners();
    BurnContract = await ethers.getContractFactory("BurnContract");
    burnContract = await BurnContract.deploy();
    await burnContract.setToken(oldRewardToken.address);
  });

  describe("Deployment of the burn contract", () => {
    it("Should set the right owner", async () => {
      expect(await burnContract.owner()).to.equal(owner.address);
    });

    it("Should set correct token", async () => {
      const token = await burnContract.hyperJumpToken();
      expect(token.address).to.equal(OldRewardToken.address);
    });
  });

  describe("Test burn in burn contract", () => {
    it("Transfered tokens should show up as available to burn", async () => {
      expect(await burnContract.available()).to.equal(0);
      await oldRewardToken.transfer(burnContract.address, 10);
      expect(await burnContract.available()).to.equal(10);
    });

    it("Should be able to burn half", async () => {
      await oldRewardToken.transfer(burnContract.address, 10);
      await burnContract.burn(5);
      expect(await burnContract.available()).to.equal(5);
    });

    it("Should have totalBurned equal to burned amount", async () => {
      await oldRewardToken.transfer(burnContract.address, 10);
      const available = await burnContract.available();
      await burnContract.burn(5);
      expect(await burnContract.totalBurned()).to.equal(available - 5);
    });

    it("Should fail burn if sender does not have enough tokens", async () => {
      await oldRewardToken.transfer(burnContract.address, 10);
      expect(burnContract.burn(11)).to.be.revertedWith("ERC20: burn amount exceeds balance");
    });

    it("Should fail to burn when not iniated by the owner", async () => {
      await oldRewardToken.transfer(burnContract.address, 10);
      expect(burnContract.connect(addr1).burn(10)).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});

// Test of Hyper Station - the farm
describe("HyperStation - test the farm", function () {
  beforeEach(async () => {
    BurnContract = await ethers.getContractFactory("BurnContract");
    burnContract = await BurnContract.deploy();
    await burnContract.setToken(rewardToken.address);
    Distributor = await ethers.getContractFactory("HyperJumpSimpleTokenDistributor");
    distributor = await Distributor.deploy();
    Farm = await ethers.getContractFactory(farmName);
    farm = await Farm.deploy();
    await farm.initStation(
      rewardToken.address,
      distributor.address,
      rewardPerSecond.toString(),
      minimumFarmPercentage.toString(),
      tradeEmissionPercentage.toString(),
      burnPercentage.toString(),
      burnContract.address
    );
    await farm.add(10, rewardToken.address, startTime.toString(), endTime.toString(), false);
    await rewardToken.transfer(distributor.address, 10);
    distributor.initialize(rewardToken.address, farm.address);
    [owner, addr1, addr2, _] = await ethers.getSigners();
  });

  describe("Deployment of the Farm", () => {
    it("Should set the correct owner", async () => {
      expect(await farm.owner()).to.equal(owner.address);
    });

    it("Should give the correct farm token address", async () => {
      expect(await farm.hyperJumpToken()).to.equal(rewardToken.address);
    });

    it("Should give the correct farm token emission", async () => {
      expect(await farm.emission_per_second()).to.equal(
        rewardPerSecond.toString()
      );
    });

    it("Should sync emissions", async () => {
      const total_amount = 1000000000;
      const seconds_in_average_month = 2628000;
      await farm.syncEmission(total_amount.toString(), seconds_in_average_month.toString());
      const expected_reward_per_second = 380;
      expect(await farm.emission_per_second()).to.equal(expected_reward_per_second.toString()
      );
    });

    it("Should give the correct pool info for pid0", async () => {
      const pid0 = await farm.poolInfo(0);
      expect(pid0.token).to.equal(rewardToken.address);
      expect(pid0.allocPoint).to.equal(pid0AllocPoint.toString());
    });

    it("Should give the correct totalAllocPoints after deployment", async () => {
      expect(await farm.totalAllocPoint()).to.equal(pid0AllocPoint.toString());
    });
    it("Should give the correct minimum Farm Emission Percentage after deployment", async () => {
      expect(await farm.minFarmEmissionPercentage()).to.equal(
        minimumFarmPercentage.toString()
      );
    });
    it("Should give the correct trade Emission Percentage after deployment", async () => {
      expect(await farm.tradeEmissionPercentage()).to.equal(
        tradeEmissionPercentage.toString()
      );
    });
    it("Should give the correct Burn Percentage after deployment", async () => {
      const receiverInfo0 = await farm.receiverInfo(0);
      expect(receiverInfo0.percentage).to.equal(burnPercentage.toString());
    });
    it("Should give the correct start time after deployment", async () => {
      const firstPool = await farm.poolInfo(0);
      expect(await firstPool.startTime).to.equal(startTime.toString());
    });
    it("Should give the correct stop time/ block after deployment", async () => {
      const firstPool = await farm.poolInfo(0);
      expect(await firstPool.endTime).to.equal(endTime.toString());
    });

    it("Should give the correct poolLength after deployment", async () => {
      expect(await farm.poolLength()).to.equal(1);
    });
  });

  describe("Test of the farm functions", () => {
    it("add pool", async () => {
      await farm.add(
        10,
        oldRewardToken.address,
        startTime.toString(),
        endTime.toString(),
        false
      );
      expect(await farm.poolLength()).to.equal(2);
      const pid1Info = await farm.poolInfo(1);
      expect(pid1Info.token).to.equal(oldRewardToken.address);
      expect(pid1Info.allocPoint).to.equal(10);
    });

    it("Test adding a pool", async () => {
      // add a pool
      await farm.add(
        10,
        oldRewardToken.address,
        startTime.toString(),
        endTime.toString(),
        false
      );
      expect(await farm.poolLength()).to.equal(2);
      const pid1Info = await farm.poolInfo(1);
      expect(pid1Info.token).to.equal(oldRewardToken.address);
      expect(pid1Info.allocPoint).to.equal(10);
    });

    it("Test deposit and withdraw into pool", async () => {
      // add a pool
      await farm.add(
        10,
        oldRewardToken.address,
        startTime.toString(),
        endTime.toString(),
        false
      );
      expect(await farm.poolLength()).to.equal(2);

      const pid1Info = await farm.poolInfo(1);
      expect(pid1Info.token).to.equal(oldRewardToken.address);
      expect(pid1Info.allocPoint).to.equal(10);

      // check if owner has balance for deposit
      const ownerBalanceOldRewardToken = await oldRewardToken.balanceOf(
        owner.address
      );

      expect(ownerBalanceOldRewardToken.toNumber()).to.be.greaterThan(10);

      // we need to approve the farm for spending old farm token
      await oldRewardToken.approve(farm.address, ownerBalanceOldRewardToken);

      // test deposit
      await farm.deposit(1, 2);
      await farm.deposit(1, 2);
      await farm.deposit(1, 2);
      await farm.deposit(1, 2);
      await farm.deposit(1, 2);

      let userInfo = await farm.userInfo(1, owner.address);
      console.log("owner amount in pid 1: ", userInfo.amount.toString());
      expect(userInfo.amount).to.equal(10);
      const newBalance = await oldRewardToken.balanceOf(owner.address);
      const consumedBalance =
        ownerBalanceOldRewardToken.toNumber() - newBalance.toNumber();
      expect(consumedBalance).to.equal(10);

      // test withdraw
      await farm.withdraw(1, userInfo.amount.toString());
      userInfo2 = await farm.userInfo(1, owner.address);
      expect(userInfo2.amount).to.equal(0);
      const withdrawnBalance =
        (await oldRewardToken.balanceOf(owner.address)).toNumber() -
        newBalance.toNumber();
      expect(withdrawnBalance).to.equal(10);
      userInfo = await farm.userInfo(1, owner.address);
      console.log("owner amount in pid 1: ", userInfo.amount.toString());
      expect(userInfo.amount).to.equal(0);
    });

    it("Test deposit for another ultimate beneficial owner and withdraw by ultimate beneficial owner", async () => {
      // add a pool
      await farm.add(
        10,
        oldRewardToken.address,
        startTime.toString(),
        endTime.toString(),
        false
      );
      const nr_of_pools = await farm.poolLength();
      const pid = nr_of_pools - 1;
      const pidInfo = await farm.poolInfo(pid);
      expect(pidInfo.token).to.equal(oldRewardToken.address);
      expect(pidInfo.allocPoint).to.equal(10);

      // transfer to addr1
      await oldRewardToken.transfer(addr1.address, 10);
      // check if addr1 has balance for deposit
      const addr1BalanceOldRewardToken = await oldRewardToken.balanceOf(
        addr1.address
      );
      expect(addr1BalanceOldRewardToken.toNumber()).to.equal(10);
      // we need to approve the farm for spending old farm token
      await oldRewardToken
        .connect(addr1)
        .approve(farm.address, addr1BalanceOldRewardToken);

      // test deposit
      const amount = 2;
      await farm.connect(addr1).depositFor(pid, amount, addr2.address);
      await farm.connect(addr1).depositFor(pid, amount, addr2.address);
      await farm.connect(addr1).depositFor(pid, amount, addr2.address);
      await farm.connect(addr1).depositFor(pid, amount, addr2.address);
      await farm.connect(addr1).depositFor(pid, amount, addr2.address);

      let userInfo = await farm.userInfo(pid, addr2.address);
      console.log("ubo amount in pool: ", userInfo.amount.toString());
      expect(userInfo.amount).to.equal(10);
      const newBalance = await oldRewardToken.balanceOf(addr1.address);
      const consumedBalance =
        addr1BalanceOldRewardToken.toNumber() - newBalance.toNumber();
      expect(consumedBalance).to.equal(10);

      // test withdraw
      const uboBalance = await oldRewardToken.balanceOf(addr2.address);
      await farm.connect(addr2).withdraw(pid, userInfo.amount.toString());
      userInfo2 = await farm.userInfo(pid, addr2.address);
      expect(userInfo2.amount).to.equal(0);
      const withdrawnBalance =
        (await oldRewardToken.balanceOf(addr2.address)).toNumber() -
        uboBalance.toNumber();
      expect(withdrawnBalance).to.equal(10);
      userInfo = await farm.userInfo(pid, addr2.address);
      console.log("ubo amount in pool: ", userInfo.amount.toString());
      expect(userInfo.amount).to.equal(0);
    });

    it("Test deposit and withdraw for another ultimate beneficial owner", async () => {
      // add a pool
      await farm.add(
        10,
        oldRewardToken.address,
        startTime.toString(),
        endTime.toString(),
        false
      );
      const nr_of_pools = await farm.poolLength();
      const pid = nr_of_pools - 1;
      const pidInfo = await farm.poolInfo(pid);
      expect(pidInfo.token).to.equal(oldRewardToken.address);
      expect(pidInfo.allocPoint).to.equal(10);

      // transfer to addr1
      await oldRewardToken.transfer(addr1.address, 10);
      // check if addr1 has balance for deposit
      const addr1BalanceOldRewardToken = await oldRewardToken.balanceOf(
        addr1.address
      );
      expect(addr1BalanceOldRewardToken.toNumber()).to.equal(10);
      // we need to approve the farm for spending old farm token
      await oldRewardToken
        .connect(addr1)
        .approve(farm.address, addr1BalanceOldRewardToken);

      // test deposit
      const amount = 2;
      await farm.connect(addr1).depositFor(pid, amount, addr2.address);
      await farm.connect(addr1).depositFor(pid, amount, addr2.address);
      await farm.connect(addr1).depositFor(pid, amount, addr2.address);
      await farm.connect(addr1).depositFor(pid, amount, addr2.address);
      await farm.connect(addr1).depositFor(pid, amount, addr2.address);

      let userInfo = await farm.userInfo(pid, addr2.address);
      console.log("ubo amount in pool: ", userInfo.amount.toString());
      expect(userInfo.amount).to.equal(10);
      const newBalance = await oldRewardToken.balanceOf(addr1.address);
      const consumedBalance =
        addr1BalanceOldRewardToken.toNumber() - newBalance.toNumber();
      expect(consumedBalance).to.equal(10);

      // register allowed withdraw initiator
      await farm.connect(addr2).registerWithdrawInitiator(addr1.address, true);
      // test withdraw for someone else
      const uboBalance = await oldRewardToken.balanceOf(addr2.address);
      await farm
        .connect(addr1)
        .withdrawFor(pid, userInfo.amount.toString(), addr2.address);
      userInfo2 = await farm.userInfo(pid, addr2.address);
      expect(userInfo2.amount).to.equal(0);
      const withdrawnBalance =
        (await oldRewardToken.balanceOf(addr2.address)).toNumber() -
        uboBalance.toNumber();
      expect(withdrawnBalance).to.equal(10);
      userInfo = await farm.userInfo(pid, addr2.address);
      console.log("ubo amount in pool: ", userInfo.amount.toString());
      expect(userInfo.amount).to.equal(0);
    });

    it("Test not allowed to withdraw for another ultimate beneficial owner", async () => {
      // add a pool
      await farm.add(
        10,
        oldRewardToken.address,
        startTime.toString(),
        endTime.toString(),
        false
      );
      const nr_of_pools = await farm.poolLength();
      const pid = nr_of_pools - 1;
      const pidInfo = await farm.poolInfo(pid);
      expect(pidInfo.token).to.equal(oldRewardToken.address);
      expect(pidInfo.allocPoint).to.equal(10);

      // transfer to addr1
      await oldRewardToken.transfer(addr1.address, 10);
      // check if addr1 has balance for deposit
      const addr1BalanceOldRewardToken = await oldRewardToken.balanceOf(
        addr1.address
      );
      expect(addr1BalanceOldRewardToken.toNumber()).to.equal(10);
      // we need to approve the farm for spending old farm token
      await oldRewardToken
        .connect(addr1)
        .approve(farm.address, addr1BalanceOldRewardToken);

      // test deposit
      const amount = 2;
      await farm.connect(addr1).depositFor(pid, amount, addr2.address);
      await farm.connect(addr1).depositFor(pid, amount, addr2.address);
      await farm.connect(addr1).depositFor(pid, amount, addr2.address);
      await farm.connect(addr1).depositFor(pid, amount, addr2.address);
      await farm.connect(addr1).depositFor(pid, amount, addr2.address);

      let userInfo = await farm.userInfo(pid, addr2.address);
      expect(userInfo.amount).to.equal(10);
      const newBalance = await oldRewardToken.balanceOf(addr1.address);
      const consumedBalance =
        addr1BalanceOldRewardToken.toNumber() - newBalance.toNumber();
      expect(consumedBalance).to.equal(10);

      // test withdraw for someone else
      const uboBalance = await oldRewardToken.balanceOf(addr2.address);
      expect(
        farm
          .connect(addr1)
          .withdrawFor(pid, userInfo.amount.toString(), addr2.address)
      ).to.be.revertedWith(
        "Need permission to initiate withdraw on behalf of someone else!"
      );
    });

    it("Test deposit and break LP for another ultimate beneficial owner", async () => {
      // add an lp token
      MockPair = await ethers.getContractFactory("MockPair");
      pair = await MockPair.deploy();
      await pair.init(oldRewardToken.address, rewardToken.address);
      // add an lp breaker mock
      MockBreakLP = await ethers.getContractFactory("MockBreakLP");
      breakLP = await MockBreakLP.deploy();
      await breakLP.setPair(pair.address);
      // register lp router
      await farm.configureLpRouter(pair.address, breakLP.address);
      // add a pool
      await farm.add(
        10,
        pair.address,
        startTime.toString(),
        endTime.toString(),
        false
      );
      const nr_of_pools = await farm.poolLength();
      const pid = nr_of_pools - 1;
      const pidInfo = await farm.poolInfo(pid);
      expect(pidInfo.token).to.equal(pair.address);
      expect(pidInfo.allocPoint).to.equal(10);

      // transfer to addr1
      await pair.transfer(addr1.address, 10);
      // make sure the breakLP router has funds to transfer
      const token0_in_lp = 1;
      const token1_in_lp = 1;
      await oldRewardToken.transfer(breakLP.address, token0_in_lp);
      await rewardToken.transfer(breakLP.address, token1_in_lp);
      // check if addr1 has balance for deposit
      const addr1BalanceLPToken = await pair.balanceOf(addr1.address);
      expect(addr1BalanceLPToken.toNumber()).to.equal(10);
      // we need to approve the farm for spending LP token
      await pair.connect(addr1).approve(farm.address, addr1BalanceLPToken);

      // test deposit
      const amount = 2;
      await farm.connect(addr1).depositFor(pid, amount, addr2.address);
      await farm.connect(addr1).depositFor(pid, amount, addr2.address);
      await farm.connect(addr1).depositFor(pid, amount, addr2.address);
      await farm.connect(addr1).depositFor(pid, amount, addr2.address);
      await farm.connect(addr1).depositFor(pid, amount, addr2.address);

      let userInfo = await farm.userInfo(pid, addr2.address);
      console.log("ubo amount in pool: ", userInfo.amount.toString());
      expect(userInfo.amount).to.equal(10);
      const newBalance = await pair.balanceOf(addr1.address);
      const consumedBalance =
        addr1BalanceLPToken.toNumber() - newBalance.toNumber();
      expect(consumedBalance).to.equal(10);

      const initial_token0 = 20;
      const initial_token1 = 0;
      const balance_token0_before = await oldRewardToken.balanceOf(
        addr2.address
      );
      expect(balance_token0_before.toNumber()).to.equal(initial_token0);
      const balance_token1_before = await rewardToken.balanceOf(addr2.address);
      expect(balance_token1_before.toNumber()).to.equal(initial_token1);

      // register allowed break LP initiator
      await farm.connect(addr2).registerBreakLpInitiator(addr1.address, true);
      // test break LP for someone else
      const uboBalance = await pair.balanceOf(addr2.address);
      await farm
        .connect(addr1)
        .breakLpFor(pid, userInfo.amount.toString(), addr2.address);

      const balance_token0_after = await oldRewardToken.balanceOf(
        addr2.address
      );
      expect(balance_token0_after.toNumber()).to.equal(
        initial_token0 + token0_in_lp
      );
      const balance_token1_after = await rewardToken.balanceOf(addr2.address);
      const received_pool_rewards = 0;
      expect(balance_token1_after.toNumber()).to.equal(
        initial_token1 + token1_in_lp + received_pool_rewards
      );

      userInfo2 = await farm.userInfo(pid, addr2.address);
      expect(userInfo2.amount).to.equal(0);
      userInfo = await farm.userInfo(pid, addr2.address);
      console.log("ubo amount in pool: ", userInfo.amount.toString());
      expect(userInfo.amount).to.equal(0);
    });
  });

  // test pending farm token
  // const pending = await farm.pendingJump(1, owner.address);
  // console.log(pending.toString());
  // expect(pending.toNumber()).to.greaterThan(0);
  describe("Test of the farm distribution functions", () => {
    it("add reciever", async () => {
      expect(await farm.receiverLength()).to.equal(1);

      // check receiver 0 = burn contract
      const receiverInfo0 = await farm.receiverInfo(0);
      expect(receiverInfo0.receiver).to.equal(burnContract.address);

      // add receiver w addr1
      await farm.addReceiver(10, addr1.address);

      // check receiver 1 = addr1
      const receiverInfo1 = await farm.receiverInfo(1);
      expect(receiverInfo1.receiver).to.equal(addr1.address);
      expect(await farm.receiverLength()).to.equal(2);
    });
  });
});

// Test of Hyper Reward Migrator
describe("HyperJumpRewardMigrator - test the migration", function () {
  beforeEach(async () => {
    Distributor = await ethers.getContractFactory("HyperJumpSimpleTokenDistributor");
    distributor = await Distributor.deploy();
    Migrator = await ethers.getContractFactory("HyperJumpRewardMigrator");
    migrator = await Migrator.deploy(
      rewardToken.address,
      oldRewardToken.address,
      conversionRate.toString(),
      distributor.address
    );
    await rewardToken.transfer(distributor.address, 100000);
    distributor.initialize(rewardToken.address, migrator.address);
    [owner, addr1, addr2, _] = await ethers.getSigners();
  });

  describe("Deployment of the Migrator", () => {
    it("Should set the correct owner", async () => {
      expect(await migrator.owner()).to.equal(owner.address);
    });

    it("Should give the correct new reward token address", async () => {
      expect(await migrator.hyperJumpToken()).to.equal(rewardToken.address);
    });

    it("Should give the correct old reward token address", async () => {
      expect(await migrator.oldRewardToken()).to.equal(oldRewardToken.address);
    });

    it("Should give the correct conversion ratio", async () => {
      expect(await migrator.conversionRatio()).to.equal(conversionRate.toString());
    });
  });

  describe("Test of the migrator functions", () => {
    it("Should Migrate old reward token to new", async () => {
      const ownerBalanceRewardToken = await rewardToken.balanceOf(owner.address);
      const ownerBalanceOldRewardToken = await oldRewardToken.balanceOf(owner.address);

      const to_migrate = ownerBalanceOldRewardToken;
      // we need to approve the migrator for spending old reward token
      await oldRewardToken.approve(migrator.address, to_migrate);
      // then we can convert
      await migrator.migrateRewardToken();

      const newOwnerRewardTokenBalance = await rewardToken.balanceOf(owner.address);
      expect(await oldRewardToken.balanceOf(owner.address)).to.equal(ownerBalanceOldRewardToken - to_migrate);
      expect(newOwnerRewardTokenBalance.sub(ownerBalanceRewardToken).toNumber()).to.equal(319);
    });
  });
});
