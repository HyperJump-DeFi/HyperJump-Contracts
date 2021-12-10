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

  // VARs for  HyperRewardMigrator
  const bsc_jump = "0x130025eE738A66E691E6A7a62381CB33c6d9Ae83";
  const hyperJumpToken = bsc_jump;
  
  // attach HyperJumpTokenDistributor
  const predeployed_HyperJumpBridgeTokenDistributor = "0x4406D7CF208FcC3503bb23B4964a558d68A3Cd70";
  const HyperJumpTokenDistributorContract = await hre.ethers.getContractFactory(
    "HyperJumpBridgeTokenDistributor"
  );
  const hyperJumpTokenDistributor =
    await HyperJumpTokenDistributorContract.attach(predeployed_HyperJumpBridgeTokenDistributor);
  console.log(
    "HyperJumpBridgeTokenDistributor attached to:",
    hyperJumpTokenDistributor.address
  );

  // attach claim LP rewards contract
  const predeployed_HyperJumpBscClaimLpRewards = "0xF153911d912de1f4FE576FbE4Ab29C075d656B58";
  const HyperJumpBscClaimLpRewardsContract = await hre.ethers.getContractFactory(
    "HyperJumpBscClaimLpRewards"
  );
  const HyperJumpBscClaimLpRewards = await HyperJumpBscClaimLpRewardsContract.attach(predeployed_HyperJumpBscClaimLpRewards);
  await HyperJumpBscClaimLpRewards.deployed();
  console.log(
    "HyperJumpBscClaimLpRewards attached to:",
    HyperJumpBscClaimLpRewards.address
  );

  // init HyperJumpBscClaimLpRewards as collector of distributor
  hyperJumpToken_collector = HyperJumpBscClaimLpRewards.address;
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
