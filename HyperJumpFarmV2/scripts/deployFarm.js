// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // VARS HyperJumpMainDistributor
  const hyperJumpToken = "0x78DE9326792ce1d6eCA0c978753c6953Cdeedd73"; // "0x78DE9326792ce1d6eCA0c978753c6953Cdeedd73"; // ftm mainnet
  const emission_start = 1635638400; // Sunday, October 31, 2021 00:00:00 GMT
  const emission_total_period = 63072000; // = 2 * 365 * 86400 = 2 years in seconds
  // 60*60*24*365/12 = 2628000 seconds in a month
  const emission_time_unit = 2628000; // This is the minimum time unit to calculate emission, we distribute each month

  // VARs for HyperJumpTokenDistributor
  // hyperjump token
  let hyperJumpToken_collector = "";

  // VARs for HyperJumpMainDistributor adding HyperJumpTokenDistributor
  const predeployed_mainDistributorAddress = "0xFeDd479723B03350cff007fe0DB19D1C6F179457";
  const weight = 100;
  const distributor_name = "fantom farm distributor";

  // VARs for  HyperJumpFarm
  // const hyperJumpToken,
  // const hyperJumpTokenDistributor;
  const rewardPerSecond = "3141592653589793238"; // 3.14.. JUMP
  const minimumFarmPercentage = 50; // 50%
  const tradeEmissionPercentage = 5; // 5%
  const burnPercentage = 20; // 20%
  const startTime = 1635638400; // Sunday, October 31, 2021 00:00:00 GMT
  const endTime = 1698710400; // Tuesday, October 31, 2023 00:00:00 GMT
  const poolWeight = 10; // first pool weight

  // deploy
  const HyperJumpMainDistributorContract = await hre.ethers.getContractFactory(
    "HyperJumpMainDistributor"
  );
  const mainDistributor = await HyperJumpMainDistributorContract.attach(
    predeployed_mainDistributorAddress
  );
  console.log("HyperJumpMainDistributor attached to:", mainDistributor.address);
  console.log(await mainDistributor.owner());
  console.log(await mainDistributor.hyperJumpToken());
  console.log(await mainDistributor.availableInMainDistributor());

  // deploy HyperJumpSimpleTokenDistributor
  const HyperJumpTokenDistributorContract = await hre.ethers.getContractFactory(
    "HyperJumpSimpleTokenDistributor"
  );
  const hyperJumpTokenDistributor =
    await HyperJumpTokenDistributorContract.deploy();
  await hyperJumpTokenDistributor.deployed();
  console.log(
    "HyperJumpSimpleTokenDistributor deployed to:",
    hyperJumpTokenDistributor.address
  );

  // add hyperjumptokendistributor in the HyperJumpMainDistributor
  console.log("Adding chain distributor");
  console.log(
    "with args:",
    hyperJumpTokenDistributor.address,
    weight,
    distributor_name
  );
  await mainDistributor.addChainDistributor(
    hyperJumpTokenDistributor.address,
    weight,
    distributor_name
  );
  console.log("Added chain distributor");

  // deploy burn contract
  const BurnContractFactory = await hre.ethers.getContractFactory(
    "BurnContract"
  );
  const BurnContract = await BurnContractFactory.deploy();
  await BurnContract.deployed();
  await BurnContract.setToken(hyperJumpToken);
  console.log("BurnContract deployed to:", BurnContract.address);

  // deploy farm
  const HyperJumpFarmContract = await hre.ethers.getContractFactory(
    "HyperJumpStation"
  );
  const HyperJumpFarm = await HyperJumpFarmContract.deploy();
  await HyperJumpFarm.deployed();
  console.log("HyperJumpStation deployed to:", HyperJumpFarm.address);
  await HyperJumpFarm.initStation(
    hyperJumpToken,
    hyperJumpTokenDistributor.address,
    rewardPerSecond,
    minimumFarmPercentage,
    tradeEmissionPercentage,
    burnPercentage,
    BurnContract.address
  );
  console.log("HyperJumpStation initialized!");
  await HyperJumpFarm.add(
    poolWeight.toString(),
    hyperJumpToken,
    startTime.toString(),
    endTime.toString(),
    false
  );
  console.log("HyperJumpStation JUMP pool added.");

  // init farm as collector of distributor
  hyperJumpToken_collector = HyperJumpFarm.address;
  await hyperJumpTokenDistributor.initialize(
    hyperJumpToken,
    hyperJumpToken_collector
  );
  console.log("Initialized HyperJumpTokenDistributor!");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
