// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  //
   line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // VARS HyperJumpMainDistributor
  const hyperJumpToken = "0x78DE9326792ce1d6eCA0c978753c6953Cdeedd73"; // ftm mainnet
  const emission_start = 1635638400; // Sunday, October 31, 2021 00:00:00 GMT
  const emission_total_period = 63072000; // = 2 * 365 * 86400 = 2 years in seconds
  // 60*60*24*365/12 = 2628000 seconds in a month
  const emission_time_unit = 2628000; // This is the minimum time unit to calculate emission, we distribute each month
  const emission_total_tokens = "200000000000000000000000000";

  // deploy
  const HyperJumpMainDistributorContract = await hre.ethers.getContractFactory(
    "HyperJumpMainDistributor"
  );
  const mainDistributor = await HyperJumpMainDistributorContract.deploy();
  await mainDistributor.deployed();
  console.log("HyperJumpMainDistributor deployed to:", mainDistributor.address);
  console.log("hyperJumpToken: %s", hyperJumpToken);
  console.log("emission_start: %s", emission_start);
  console.log("emission_total_period: %s", emission_total_period);
  console.log("emission_time_unit: %s", emission_time_unit);
  console.log("emission_total_tokens: %s", emission_total_tokens);
  await mainDistributor.initialize(
    hyperJumpToken,
    emission_start,
    emission_total_period,
    emission_time_unit,
    emission_total_tokens
  );
  console.log("HyperJumpMainDistributor initialized!");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
