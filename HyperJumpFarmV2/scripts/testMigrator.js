// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const FIVE = ethers.BigNumber.from('5000000000000000000');

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');
  const [owner] = await ethers.getSigners();
  console.log('owner wallet: %s', owner.address);
  let balance = await ethers.provider.getBalance(owner.address);
  console.log('owner balance: %s BNB', (balance/1e18));

  const oldreward_address = "0x55c3caefbde8d5eb3e9c2c99888bedf303434ba9"; // ftm testnet "0x5217e0AA078DDf0DE36150B7f462D136245466D3";
  const oldreward_factory = await ethers.getContractFactory("ERC20");
  const oldreward = await oldreward_factory.attach(oldreward_address);

  let oldreward_balance = await oldreward.balanceOf(owner.address);
  console.log('owner balance: %s OLDREWARD', (oldreward_balance/1e18));

  const jump_address = "0x78DE9326792ce1d6eCA0c978753c6953Cdeedd73";
  const jump_factory = await ethers.getContractFactory("HyperJumpToken");
  const jump = await jump_factory.attach(jump_address);
  
  let jump_balance = await jump.balanceOf(owner.address);
  console.log('owner balance: %s JUMP', (jump_balance/1e18));

  const migrator_address = "0x4F19004b7012035D1DDD30795860e44D79a59beA"; // fmt testnet "0xb40599BA64Bf5C7Fa91fDBd0A925aA341Ec9205C";
  const migrator_factory = await ethers.getContractFactory("HyperJumpRewardMigrator");
  const migrator = await migrator_factory.attach(migrator_address);

  let migrator_distributor_address = await migrator.hyperJumpTokenDistributor();
  console.log('migrator distributor: %s', migrator_distributor_address);

  let migrator_distributor_balance = await jump.balanceOf(migrator_distributor_address);
  console.log('migrator distributor balance: %s JUMP', (migrator_distributor_balance/1e18));
  
  // approve migration
  const to_migrate = FIVE;
  console.log('Approving migrator to spend OLDREWARD');
  var tx = await oldreward.approve(migrator_address, to_migrate); 
  var tx_receipt = await tx.wait();
  if (tx_receipt.status==1) {
     console.log('Approved migrator as OLDREWARD spender');
  } else {
     console.log('Failed allowing migrator to spend OLDREWARD %s', JSON.stringify(tx_receipt));
  }

  // migrate
  console.log('Converting %s OLDREWARD -> JUMP', (to_migrate/1e18));
  var tx = await migrator.migrateRewardToken(to_migrate);
  var tx_receipt = await tx.wait();
  if (tx_receipt.status==1) {
     console.log('Migrated JUMP');
  } else {
     console.log('Failed migrating to JUMP %s', JSON.stringify(tx_receipt));
  }

  oldreward_balance = await oldreward.balanceOf(owner.address);
  console.log('owner balance: %s OLDREWARD', (oldreward_balance/1e18));
  jump_balance = await jump.balanceOf(owner.address);
  console.log('owner balance: %s JUMP', (jump_balance/1e18));
  migrator_distributor_balance = await jump.balanceOf(migrator_distributor_address);
  console.log('migrator distributor balance: %s JUMP', (migrator_distributor_balance/1e18));
  
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
