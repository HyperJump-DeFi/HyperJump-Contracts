// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

const Multicall = require('ethers-multicall');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');
  const chainId = (await ethers.provider.getNetwork()).chainId;
  console.log('chainId: %s', chainId);
  
  const [owner] = await ethers.getSigners();
  console.log('owner wallet: %s', owner.address);
  let balance = await ethers.provider.getBalance(owner.address);
  console.log('owner balance: %s FTM', (balance/1e18));

  const farm_address = "0x90Df158ff7c31aD1d81ddDb1D8ab9d0eCBCeDa20";
  console.log('FTM farm: %s', farm_address);
  const farm_factory = await ethers.getContractFactory("OldHyperJumpStation");
  const farm = await farm_factory.attach(farm_address);
  
  // get event topic
  const eventTopic = ethers.utils.id("Deposit(address,uint256,uint256)"); //deposit.topic;
  console.log('eventTopic: %s', JSON.stringify(eventTopic));
  const initial_fromBlock = 5110091;
  const final_toBlock = 22248947;
  const blockLogSize = 10000;
 
  var depositors_set = new Set();
  
  var fromBlock = initial_fromBlock;
  while (fromBlock < final_toBlock) {
      var toBlock = fromBlock+blockLogSize;
      if (toBlock > final_toBlock) toBlock = final_toBlock;
      console.log('Querying from block %s to %s', fromBlock, toBlock);
      var farm_deposit_logs = await ethers.provider.getLogs({
        fromBlock: fromBlock,
        toBlock: toBlock,
        address: farm_address,
        topics: [eventTopic]
      });
      console.log('farm_deposit_logs found %s Deposit logs', farm_deposit_logs.length);
      for (var b=0; b < farm_deposit_logs.length; b++) {
         var log = farm_deposit_logs[b];
         var depositor_address = log.topics[1].replaceAll(new RegExp("^0x000000000000000000000000","g"),'0x');
         console.log('   block %s    pid %s    depositor %s', log.blockNumber, log.topics[2]*1, depositor_address);
         depositors_set = depositors_set.add(depositor_address);
      }
      fromBlock += blockLogSize+1;
  }
  
  var ftm_depositors = Array.from(depositors_set);
  ftm_depositors.sort();
   
   const nr_of_users = ftm_depositors.length;
   console.log('FTM farm: %s users collected.', nr_of_users);
   const nr_of_pools = await farm.poolLength();
   console.log('FTM farm: %s pools found.', nr_of_pools);

   const blockTag = final_toBlock;
   console.log('Querying at blockTag %s', blockTag);

   const multicallProvider = new Multicall.Provider(ethers.provider);
   await multicallProvider.init();
   const multicallFarm = new Multicall.Contract(farm_address, farm_factory.interface.fragments);
   const tx_options = {blockTag:blockTag};

   console.log('Querying poolInfo');
   var multicalls = [];
   for (var pid=0;pid<nr_of_pools;pid++) {
       var multicall = multicallFarm.poolInfo(pid);
       multicalls.push(multicall);
   }
   var pool_results = await multicallProvider.all(multicalls, tx_options);
   console.log('Found '+pool_results.length+' pool results.');

   console.log('Querying pool token symbols');
   multicalls = [];
   for (var pid=0;pid<nr_of_pools;pid++) {
       var token_address = pool_results[pid][0];
       var token_factory = await ethers.getContractFactory("ERC20")
       var multicall_token = new Multicall.Contract(token_address, token_factory.interface.fragments);
       var multicall = multicall_token.symbol();
       multicalls.push(multicall);
   }
   var pool_symbols = await multicallProvider.all(multicalls, tx_options);
   console.log('Found '+pool_symbols.length+' pool symbols.');

   console.log('Querying pool token decimals');
   multicalls = [];
   for (var pid=0;pid<nr_of_pools;pid++) {
       var token_address = pool_results[pid][0];
       var token_factory = await ethers.getContractFactory("ERC20")
       var multicall_token = new Multicall.Contract(token_address, token_factory.interface.fragments);
       var multicall = multicall_token.decimals();
       multicalls.push(multicall);
   }
   var pool_decimals = await multicallProvider.all(multicalls, tx_options);
   console.log('Found '+pool_decimals.length+' pool decimals.');

   const csvWriter = createCsvWriter({
    path: 'ftm_pending_userrewards.csv',
    header: [
      {id: 'wallet', title: 'Wallet'},
      {id: 'pendingAlloy', title: 'Pending ORI'},
      {id: 'pendingJump', title: 'Pending JUMP'},
      {id: 'formattedPendingAlloy', title: 'Formatted Pending ORI'},
      {id: 'formattedPendingJump', title: 'Formatted Pending JUMP'},
    ]
   });

   var csv_data = [];
   
   var total_pending = 0;
   for (var u=0;u<nr_of_users;u++) {
      var user = ftm_depositors[u];
      process.stdout.write('Querying user #'+u+' : '+user);
      multicalls = [];
      for (var pid=0;pid<nr_of_pools;pid++) {
         var multicall = multicallFarm.userInfo(pid, user);
         multicalls.push(multicall);
      }
      process.stdout.write(' '+multicalls.length+ ' calls => ');
      var user_results = await multicallProvider.all(multicalls, tx_options);
      console.log('returning '+user_results.length+' results.');
      var user_pending = 0;
      for (var pid=1;pid<nr_of_pools;pid++) {
         var user_result = user_results[pid];
         if (!user_result) continue;
         var amount = user_result[0];
         if (amount && amount > 0) {
             console.log('   user: %s pid: %s amount: %s', user, pid, (amount/1));
             var rewardDebt = user_result[1];
             var accRewardPerShare = pool_results[pid][3];
             var pending = amount * accRewardPerShare / 1e12 - rewardDebt;
             console.log(' || pending = amount * accRewardPerShare / 1e12 - rewardDebt');
             console.log(' || '+pending+' = '+amount+' * '+accRewardPerShare+' / 1e12 - '+rewardDebt);
             
             if (pending > 0) {
                console.log('************** user %s pool %s pending = %s ORI', user, pid, (pending/1e18));
                total_pending = total_pending + pending;
                console.log('<====> cumulative total pending = %s ORI thus need %s JUMP', (total_pending/1e18), (total_pending/5/1e18));
                user_pending = user_pending + pending;
             }
         }
      }
      if (user_pending>0) {
         csv_data.push({
                  wallet: ethers.utils.getAddress(user),
                  pendingAlloy: user_pending,
                  pendingJump: (user_pending/5),
                  formattedPendingAlloy: (user_pending/1e18),
                  formattedPendingJump: (user_pending/5/1e18)
         });
      }
   }
   
   //console.log('csv_data: %s', JSON.stringify(csv_data));
   await csvWriter.writeRecords(csv_data);
   console.log('Finished writing the CSV file');

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
