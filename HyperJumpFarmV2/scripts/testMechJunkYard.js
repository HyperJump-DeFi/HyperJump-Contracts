// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const TEN = ethers.BigNumber.from('10000000000000000000');

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

  const oldmech_address = "0x85c85647e1a79c2b8bc3ed2b6a1dde326eec66c5";
  const oldmech_factory = await ethers.getContractFactory("ERC20");
  const oldmech = await oldmech_factory.attach(oldmech_address);

  let oldmech_balance = await oldmech.balanceOf(owner.address);
  console.log('owner balance: %s MECH', (oldmech_balance/1e18));

  const jump_address = "0x78DE9326792ce1d6eCA0c978753c6953Cdeedd73";
  const jump_factory = await ethers.getContractFactory("HyperJumpToken");
  const jump = await jump_factory.attach(jump_address);
  
  let jump_balance = await jump.balanceOf(owner.address);
  console.log('owner balance: %s JUMP', (jump_balance/1e18));

  const junkyard_address = "0xcA1DCD49cdd5C52df3f5b61E80e914D566461090";
  const junkyard_factory = await ethers.getContractFactory("HyperJumpMechJunkYard");
  const junkyard = await junkyard_factory.attach(junkyard_address);

  let junkyard_distributor_address = await junkyard.hyperJumpTokenDistributor();
  console.log('junkyard distributor: %s', junkyard_distributor_address);

  let junkyard_distributor_balance = await jump.balanceOf(junkyard_distributor_address);
  console.log('junkyard distributor balance: %s JUMP', (junkyard_distributor_balance/1e18));
  
  // send JUMP to distributor
  console.log('send some JUMP to junkyard distributor');
  await jump.transfer(junkyard_distributor_address, TEN);
  junkyard_distributor_balance = await jump.balanceOf(junkyard_distributor_address);
  console.log('junkyard distributor balance: %s JUMP', (junkyard_distributor_balance/1e18));

  let junkyard_mech_balance = await oldmech.balanceOf(junkyard_address);
  console.log('junkyard MECH balance: %s MECH', (junkyard_mech_balance/1e18));
  
  // approve migration
  const to_migrate = TEN;
  console.log('Approving junkyard to spend 10 MECH');
  var tx = await oldmech.approve(junkyard_address, to_migrate); 
  var tx_receipt = await tx.wait();
  if (tx_receipt.status==1) {
     console.log('Approved junkyard as MECH spender');
  } else {
     console.log('Failed allowing junkyard to spend MECH %s', JSON.stringify(tx_receipt));
  }

  // migrate
  console.log('Converting MECH -> JUMP');
  var tx = await junkyard.migrateMechToken();
  var tx_receipt = await tx.wait();
  if (tx_receipt.status==1) {
     console.log('Migrated JUMP');
  } else {
     console.log('Failed migrating to JUMP %s', JSON.stringify(tx_receipt));
  }

  oldmech_balance = await oldmech.balanceOf(owner.address);
  console.log('owner balance: %s MECH', (oldmech_balance/1e18));
  jump_balance = await jump.balanceOf(owner.address);
  console.log('owner balance: %s JUMP', (jump_balance/1e18));
  junkyard_distributor_balance = await jump.balanceOf(junkyard_distributor_address);
  console.log('junkyard distributor balance: %s JUMP', (junkyard_distributor_balance/1e18));
  junkyard_mech_balance = await oldmech.balanceOf(junkyard_address);
  console.log('junkyard MECH balance: %s MECH', (junkyard_mech_balance/1e18));
  
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
