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

  const jump_address = "0x78DE9326792ce1d6eCA0c978753c6953Cdeedd73";
  const jump_factory = await ethers.getContractFactory("HyperJumpToken");
  const jump = await jump_factory.attach(jump_address);
  
  let jump_balance = await jump.balanceOf(owner.address);
  console.log('owner balance: %s JUMP', (jump_balance/1e18));

  const burn_address = "0x3339e128FE4dF4d80f2Aa95ffDA953b983815c4e"; // ftm testnet "0xFD5b495D6ce1a98102a14A7443928FC1B31a200D";
  const burn_factory = await ethers.getContractFactory("BurnContract");
  const burn = await burn_factory.attach(burn_address);

  let burn_balance = await jump.balanceOf(burn_address);
  console.log('burn contract balance: %s', (burn_balance/1e18));

  // burn
  console.log('Burning all in burn contract');
  var tx = await burn.burnAll(); 
  var tx_receipt = await tx.wait();
  if (tx_receipt.status==1) {
     console.log('Burned all');
  } else {
     console.log('Failed burning %s', JSON.stringify(tx_receipt));
  }

  jump_balance = await jump.balanceOf(owner.address);
  console.log('owner balance: %s JUMP', (jump_balance/1e18));
  burn_balance = await jump.balanceOf(burn_address);
  console.log('burn contract balance: %s', (burn_balance/1e18));
  
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
