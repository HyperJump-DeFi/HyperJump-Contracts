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
  const bridge_address = "0x8027a7fa5753c8873e130f1205da9fb8691726ab"; // synapse bridge in bsc
  const bridge_receiver = true; // this the receiving distributor in bsc
  const destination_address = "0xFeDd479723B03350cff007fe0DB19D1C6F179457"; // HyperJumpMainDistributor in fantom
  const destination_chainId = 250; // bridge back to fantom

  // VARs for  HyperMechMigrator
  const bsc_jump = "0x130025eE738A66E691E6A7a62381CB33c6d9Ae83";
  const hyperJumpToken = bsc_jump;
  
  const bsc_mech = "0x3ae713c662b8852d686e718e0762631a4cb84954";
  const oldMechToken = bsc_mech;
  
  const conversionRatio = 1; // mech->jump conversion rate
  // const hyperJumpTokenDistributor;

 // deploy HyperJumpTokenDistributor
  const HyperJumpTokenDistributorContract = await hre.ethers.getContractFactory(
    "HyperJumpBridgeTokenDistributor"
  );
  const hyperJumpTokenDistributor =
    await HyperJumpTokenDistributorContract.deploy();
  await hyperJumpTokenDistributor.deployed();
  console.log(
    "HyperJumpBridgeTokenDistributor deployed to:",
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
