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

  // VARs for HyperJumpTokenDistributor
  // hyperjump token
  let hyperJumpToken_collector = "";

  // VARs for HyperJumpMainDistributor adding HyperJumpTokenDistributor
  const predeployed_mainDistributorAddress = "0xA565037058DF44F336e01683E096CDDe45cFE5c2";
  const weight = 100;
  const distributor_name = "manual bsc bridge distributor";

  // deploy
  const HyperJumpMainDistributorContract = await hre.ethers.getContractFactory(
    "HyperJumpMainDistributor"
  );
  const mainDistributor = await HyperJumpMainDistributorContract.attach(
    predeployed_mainDistributorAddress
  );
  console.log("HyperJumpMainDistributor attached to:", mainDistributor.address);

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
  console.log("Adding manual bridge distributor");
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
  console.log("Added manual bridge distributor");

  // init deployer wallet as collector of manual bridge distributor
  [deployer_address] = await ethers.getSigners();
  console.log('registering wallet %s as manual bridge collector', deployer_address);
  hyperJumpToken_collector = deployer_address;
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
