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

  // VARs for HyperJumpTokenDistributor
  // hyperjump token
  let hyperJumpToken_collector = "";
  const bridge_address = ""; 
  const bridge_receiver = "";

  // VARs for  HyperMechMigrator
  const ftm_jump = "0x78DE9326792ce1d6eCA0c978753c6953Cdeedd73";
  const hyperJumpToken = ftm_jump;
  
  const ftm_mech = "0x85c85647e1a79c2b8bc3ed2b6a1dde326eec66c5";
  const oldMechToken = ftm_mech;
  
  const conversionRatio = 1; // mech->jump conversion rate
  // const hyperJumpTokenDistributor;

  // deploy HyperJumpTokenDistributor
  const HyperJumpTokenDistributorContract = await hre.ethers.getContractFactory(
    "HyperJumpRecycleTokenDistributor"
  );
  const hyperJumpTokenDistributor =
    await HyperJumpTokenDistributorContract.deploy();
  await hyperJumpTokenDistributor.deployed();
  console.log(
    "HyperJumpRecycleTokenDistributor deployed to:",
    hyperJumpTokenDistributor.address
  );

  // deploy migrator
  const HyperJumpMechJunkYardContract = await hre.ethers.getContractFactory(
    "HyperJumpMechJunkYard"
  );
  const HyperJumpMechJunkYard = await HyperJumpMechJunkYardContract.deploy(
    hyperJumpToken,
    oldMechToken,
    conversionRatio,
    hyperJumpTokenDistributor.address
  );
  await HyperJumpMechJunkYard.deployed();
  console.log(
    "HyperJumpMechJunkYard deployed to:",
    HyperJumpMechJunkYard.address
  );

  // init migrator as collector of distributor
  hyperJumpToken_collector = HyperJumpMechJunkYard.address;
  const mainDistributor = "0xFeDd479723B03350cff007fe0DB19D1C6F179457";
  await hyperJumpTokenDistributor.setupRecycler(
    hyperJumpToken,
    hyperJumpToken_collector,
    mainDistributor
  );
  console.log("Initialized HyperJumpRecycleTokenDistributor!");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
