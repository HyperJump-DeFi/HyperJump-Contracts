// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const ONE = ethers.BigNumber.from('1000000000000000000');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');
  const chainId = (await ethers.provider.getNetwork()).chainId;
  console.log('chainId: %s', chainId);
  
  const [owner] = await ethers.getSigners();
  console.log('owner wallet: %s', owner.address);
  let balance = await ethers.provider.getBalance(owner.address);
  console.log('owner balance: %s BNB', (balance/1e18));

  const jump_address = "0x78DE9326792ce1d6eCA0c978753c6953Cdeedd73";
  const jump_factory = await ethers.getContractFactory("HyperJumpToken");
  const jump = await jump_factory.attach(jump_address);
  
  let jump_balance = await jump.balanceOf(owner.address);
  console.log('owner balance: %s JUMP', (jump_balance/1e18));

  const farm_address = "0xCB46BAaaB0667615F3E90c3edd4Ec7f021A5DcA1"; // ftm testnet "0x7A0De9A006129A18AE8d3C4e609fa866EE29A5B3";
  const farm_factory = await ethers.getContractFactory("HyperJumpStation");
  const farm = await farm_factory.attach(farm_address);

  let farm_balance = await jump.balanceOf(farm_address);
  console.log('farm balance: %s JUMP', (farm_balance/1e18));

  let farm_distributor_address = await farm.hyperJumpTokenDistributor();
  console.log('farm distributor: %s', farm_distributor_address);

  let farm_distributor_balance = await jump.balanceOf(farm_distributor_address);
  console.log('farm distributor balance: %s JUMP', (farm_distributor_balance/1e18));
  
  // approve farm
  const to_stake = ONE;
  console.log('Approving farm to spend JUMP');
  var tx = await jump.approve(farm_address, to_stake); 
  var tx_receipt = await tx.wait();
  if (tx_receipt.status==1) {
     console.log('Approved farm to stake JUMP');
  } else {
     console.log('Failed allowing farm to spend JUMP %s', JSON.stringify(tx_receipt));
  }

  // stake
  console.log('Staking %s JUMP', (to_stake/1e18));
  const pid = 0;
  var tx = await farm.deposit(pid, to_stake);
  var tx_receipt = await tx.wait();
  if (tx_receipt.status==1) {
     console.log('Staked JUMP');
  } else {
     console.log('Failed staking JUMP %s', JSON.stringify(tx_receipt));
  }

  jump_balance = await jump.balanceOf(owner.address);
  console.log('owner balance: %s JUMP', (jump_balance/1e18));
  farm_distributor_balance = await jump.balanceOf(farm_distributor_address);
  console.log('farm distributor balance: %s JUMP', (farm_distributor_balance/1e18));
  farm_balance = await jump.balanceOf(farm_address);
  console.log('farm balance: %s JUMP', (farm_balance/1e18));
 
  if (chainId == 31337) {
  // speed up time by 1 hour
     console.log('speeding up blockchain time by 1 hour');
     await ethers.provider.send("evm_increaseTime", [3600]);
  } else {
  // wait a few seconds
     console.log('waiting 10 seconds');
     await sleep(10000);
  }
  
  // claim yield
  console.log('Claim JUMP yield');
  var tx = await farm.withdraw(pid, 0);
  var tx_receipt = await tx.wait();
  if (tx_receipt.status==1) {
     console.log('Claimed JUMP yield');
  } else {
     console.log('Failed claiming JUMP yield %s', JSON.stringify(tx_receipt));
  }

  jump_balance = await jump.balanceOf(owner.address);
  console.log('owner balance: %s JUMP', (jump_balance/1e18));
  farm_distributor_balance = await jump.balanceOf(farm_distributor_address);
  console.log('farm distributor balance: %s JUMP', (farm_distributor_balance/1e18));
  farm_balance = await jump.balanceOf(farm_address);
  console.log('farm balance: %s JUMP', (farm_balance/1e18));

  // withdraw JUMP
  const to_withdraw = ONE;
  console.log('Withdrawing %s JUMP', (to_withdraw/1e18));
  var tx_options = { gasLimit:300000 }; // set manual gas limit
  var tx = await farm.withdraw(pid, to_withdraw, tx_options);
  var tx_receipt = await tx.wait();
  if (tx_receipt.status==1) {
     console.log('Withdrawn JUMP');
  } else {
     console.log('Failed withdrawing JUMP %s', JSON.stringify(tx_receipt));
  }

  jump_balance = await jump.balanceOf(owner.address);
  console.log('owner balance: %s JUMP', (jump_balance/1e18));
  farm_distributor_balance = await jump.balanceOf(farm_distributor_address);
  console.log('farm distributor balance: %s JUMP', (farm_distributor_balance/1e18));
  farm_balance = await jump.balanceOf(farm_address);
  console.log('farm balance: %s JUMP', (farm_balance/1e18));
  
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
