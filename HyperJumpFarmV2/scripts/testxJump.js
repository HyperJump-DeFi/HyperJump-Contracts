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
  if (chainId == 31337) { // HACK to be able to impersonate farm owner wallet while running in a hardhat task
     hre.ethers.provider = new ethers.providers.JsonRpcProvider(hre.ethers.provider.connection.url)
  }
  
  const [owner] = await ethers.getSigners();
  console.log('test owner wallet: %s', owner.address);
  let balance = await ethers.provider.getBalance(owner.address);
  console.log('test owner balance: %s BNB', (balance/1e18));

  const jump_address = "0x78DE9326792ce1d6eCA0c978753c6953Cdeedd73";
  const jump_factory = await ethers.getContractFactory("HyperJumpToken");
  const jump = await jump_factory.attach(jump_address);

  if (chainId == 31337) {
     const jump_holder = "0x2E8993d354B64311868E246d17E8e361404eEbcb";
     console.log('Impersonating JUMP holder %s', jump_holder);
     await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [jump_holder],
     });
     const jump_signer = await ethers.provider.getSigner(jump_holder);
     await jump.connect(jump_signer).transfer(owner.address, ONE);
     console.log('Transfered 1 JUMP to test owner wallet.');
     await hre.network.provider.request({
        method: "hardhat_stopImpersonatingAccount",
        params: [jump_holder],
     });
     console.log('Stopped impersonating JUMP holder %s', jump_holder);
  }
  
  let jump_balance = await jump.balanceOf(owner.address);
  console.log('test owner balance: %s JUMP', (jump_balance/1e18));

  const farm_address = "0x2E03284727Ff6E50BB00577381059a11e5Bb01dE";
  const farm_factory = await ethers.getContractFactory("HyperJumpStation");
  const farm = await farm_factory.attach(farm_address);

  let farm_balance = await jump.balanceOf(farm_address);
  console.log('farm balance: %s JUMP', (farm_balance/1e18));

  let farm_distributor_address = await farm.hyperJumpTokenDistributor();
  console.log('farm distributor: %s', farm_distributor_address);

  let farm_distributor_balance = await jump.balanceOf(farm_distributor_address);
  console.log('farm distributor balance: %s JUMP', (farm_distributor_balance/1e18));
  
  
  // We get the contract to deploy xJUMP
  const xJumpTokenContract = await hre.ethers.getContractFactory("WrappedHyperJumpToken");
  const xjumpToken= await xJumpTokenContract.deploy();

  await xjumpToken.deployed();

  console.log("xJUMP deployed to:", xjumpToken.address);

  // add pool for xJUMP
  const poolWeight = 10; // pool weight
  const startTime = 1635638400; // Sunday, October 31, 2021 00:00:00 GMT
  const endTime = 1698710400; // Tuesday, October 31, 2023 00:00:00 GMT
  if (chainId == 31337) {
     const farm_owner = await farm.owner();
     console.log('Trying to impersonate farm owner %s', farm_owner);
     await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [farm_owner],
     });
     console.log('Impersonating farm owner %s', farm_owner);
     const farm_signer = await ethers.provider.getSigner(farm_owner);
     await farm.connect(farm_signer).add(
       poolWeight.toString(),
       jump_address,
       startTime.toString(),
       endTime.toString(),
       false
     );
     await hre.network.provider.request({
        method: "hardhat_stopImpersonatingAccount",
        params: [farm_owner],
     });
     console.log('Stopped impersonating farm owner %s', farm_owner);
  } else {
     await farm.add(
       poolWeight.toString(),
       xjumpToken.address,
       startTime.toString(),
       endTime.toString(),
       false
     );
  }
  console.log("HyperJumpStation xJUMP pool added.");
    
  const pid = (await farm.poolLength()) - 1;
  console.log('xJUMP pool has pid %s', pid);

  
  // init wrapped token
  await xjumpToken.initWrappedHyperJumpToken(jump_address, farm_address, pid);
  console.log('initialized wrapped hyperjump token');
  
  // approve JUMP to wrap
  const to_stake = ONE;
  console.log('Approving xJUMP to spend JUMP');
  var tx = await jump.approve(xjumpToken.address, to_stake); 
  var tx_receipt = await tx.wait();
  if (tx_receipt.status==1) {
     console.log('Approved xJump to spend JUMP');
  } else {
     console.log('Failed allowing xJump to spend JUMP %s', JSON.stringify(tx_receipt));
  }

  // deposit JUMP into farm via xJUMP
  await xjumpToken.deposit(to_stake);

  var xjump_balance = await xjumpToken.balanceOf(owner.address);
  console.log('test owner balance: %s xJUMP', (xjump_balance/1e18));
  jump_balance = await jump.balanceOf(owner.address);
  console.log('test owner balance: %s JUMP', (jump_balance/1e18));
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

  xjump_balance = await xjumpToken.balanceOf(owner.address);
  console.log('test owner balance: %s xJUMP', (xjump_balance/1e18));
  jump_balance = await jump.balanceOf(owner.address);
  console.log('test owner balance: %s JUMP', (jump_balance/1e18));
  farm_distributor_balance = await jump.balanceOf(farm_distributor_address);
  console.log('farm distributor balance: %s JUMP', (farm_distributor_balance/1e18));
  farm_balance = await jump.balanceOf(farm_address);
  console.log('farm balance: %s JUMP', (farm_balance/1e18));

  // register xjump as withdraw initiator
  await farm.registerWithdrawInitiator(xjumpToken.address, true);
  console.log('Registered xJump as withdraw initiator');

  // withdraw JUMP
  const to_withdraw = ONE;
  console.log('Withdrawing %s JUMP', (to_withdraw/1e18));
  var tx_options = { gasLimit:300000 }; // set manual gas limit
  var tx = await xjumpToken.withdraw(to_withdraw, tx_options);
  var tx_receipt = await tx.wait();
  if (tx_receipt.status==1) {
     console.log('Withdrawn JUMP');
  } else {
     console.log('Failed withdrawing JUMP %s', JSON.stringify(tx_receipt));
  }

  xjump_balance = await xjumpToken.balanceOf(owner.address);
  console.log('test owner balance: %s xJUMP', (xjump_balance/1e18));
  jump_balance = await jump.balanceOf(owner.address);
  console.log('test owner balance: %s JUMP', (jump_balance/1e18));
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
