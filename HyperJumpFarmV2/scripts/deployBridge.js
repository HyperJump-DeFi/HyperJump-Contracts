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
  const hyperJumpToken = "0x78DE9326792ce1d6eCA0c978753c6953Cdeedd73"; // ftm mainnet

  // VARs for HyperJumpBridgeTokenDistributor
  // hyperjump token
  let hyperJumpToken_collector = "";

  // VARs for HyperJumpMainDistributor adding HyperJumpBridgeTokenDistributor
  const predeployed_mainDistributorAddress = "0xFeDd479723B03350cff007fe0DB19D1C6F179457";
  const weight = 100;
  const distributor_name = "bsc bridge distributor";

  // get main distributor
  const HyperJumpMainDistributorContract = await hre.ethers.getContractFactory(
    "HyperJumpMainDistributor"
  );
  const mainDistributor = await HyperJumpMainDistributorContract.attach(
    predeployed_mainDistributorAddress
  );
  console.log("HyperJumpMainDistributor attached to:", mainDistributor.address);

  // deploy HyperJumpBridgeTokenDistributor
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

  // setting up bridge
  const no_collector = "0x0000000000000000000000000000000000000000";
  const bridge = "0xe910dfaa50094c6bc1bf68e3cd7b244e9ec09d57"; // synapse bridge
  const bridge_receiver = false;
  const destination_address = "0x7F0a733B03EC455cb340E0f6af736A13d8fBB851"; // bsc farm distributor HyperJumpBridgeTokenDistributor
  const destination_chain = 56;
  await hyperJumpTokenDistributor.setupBridge(
    hyperJumpToken,
    no_collector,
    bridge,
    bridge_receiver,
    destination_address,
    destination_chain
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
