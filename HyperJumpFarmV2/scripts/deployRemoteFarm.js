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
  const hyperJumpToken = "0x130025eE738A66E691E6A7a62381CB33c6d9Ae83"; // <-- is BSC bridged token address,  that is ftm token address --> "0x78DE9326792ce1d6eCA0c978753c6953Cdeedd73"; // ftm mainnet

  // VARs for HyperJumpBridgeTokenDistributor
  // hyperjump token
  let hyperJumpToken_collector = "";
  const bridge_address = "0x8027a7fa5753c8873e130f1205da9fb8691726ab"; // synapse bridge in bsc
  const bridge_receiver = true; // this the receiving distributor in bsc
  const destination_address = "0xFeDd479723B03350cff007fe0DB19D1C6F179457"; // HyperJumpMainDistributor in fantom
  const destination_chainId = 250; // bridge back to fantom

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

  // deploy HyperJumpBridgeTokenDistributor
  const HyperJumpTokenDistributorFactory = await hre.ethers.getContractFactory(
    "HyperJumpBridgeTokenDistributor"
  );
  const hyperJumpTokenDistributor =
    await HyperJumpTokenDistributorFactory.deploy();
  await hyperJumpTokenDistributor.deployed();
  console.log(
    "HyperJumpBridgeTokenDistributor deployed to:",
    hyperJumpTokenDistributor.address
  );

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
  await hyperJumpTokenDistributor.setupBridge(
    hyperJumpToken,
    hyperJumpToken_collector,
    bridge_address,
    bridge_receiver,
    destination_address,
    destination_chainId
  );
  console.log("Initialized HyperJumpBridgeTokenDistributor!");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
