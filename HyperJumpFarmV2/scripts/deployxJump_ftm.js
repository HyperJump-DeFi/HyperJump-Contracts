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
  if (chainId != 250) return; // ftm script
  
  const [owner] = await ethers.getSigners();
  console.log('owner wallet: %s', owner.address);
  let balance = await ethers.provider.getBalance(owner.address);
  console.log('owner balance: %s FTM', (balance/1e18));

  const jump_address = "0x78DE9326792ce1d6eCA0c978753c6953Cdeedd73";
  const jump_factory = await ethers.getContractFactory("HyperJumpToken");
  const jump = await jump_factory.attach(jump_address);

  const farm_address = "0x2E03284727Ff6E50BB00577381059a11e5Bb01dE";
  const farm_factory = await ethers.getContractFactory("HyperJumpStation");
  const farm = await farm_factory.attach(farm_address);

  // We get the contract to deploy xJUMP
  const xJumpTokenContract = await hre.ethers.getContractFactory("WrappedHyperJumpToken");
  const xjumpToken= await xJumpTokenContract.deploy();

  await xjumpToken.deployed();

  console.log("xJUMP deployed to:", xjumpToken.address);

  // add pool for xJUMP
  const poolWeight = 10; // pool weight
  const startTime = 1635638400; // Sunday, October 31, 2021 00:00:00 GMT
  const endTime = 1698710400; // Tuesday, October 31, 2023 00:00:00 GMT
  await farm.add(
    poolWeight.toString(),
    xjumpToken.address,
    startTime.toString(),
    endTime.toString(),
    false
  );
  console.log("HyperJumpStation xJUMP pool added.");
    
  const pid = (await farm.poolLength()) - 1;
  console.log('xJUMP pool has pid %s', pid);
  
  // init wrapped token
  await xjumpToken.initWrappedHyperJumpToken(jump_address, farm_address, pid);
  console.log('initialized wrapped hyperjump token with pool reference');
  
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
