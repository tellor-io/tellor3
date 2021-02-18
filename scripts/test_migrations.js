/*******************************************************************/

/**********TEST MIGRATIONS ***************************************/

/******************************************************************/
//Rinkby
tellorMaster = ''

//mainnet
//tellorMaster = ''

async function migrations(masterAddr, ) {
    // We get the contract to deploy
    const Tellor = await ethers.getContractFactory("Tellor");
    const tellor= await Tellor.deploy();
    console.log("Tellor deployed to:", tellor.address);

    const Master = await ethers.getContractFactory("TellorMaster");
    const tellorMaster= await Master.deploy(tellor.address, _oldTellor );
    console.log("TellorMaster deployed to:", tellorMaster.address);

    const Stake = await ethers.getContractFactory("TellorStake");
    const stake = await Stake.deploy( );
    console.log("tellorStake", stake.address)
    await tellorMaster.changeTellorGetters(getter.address)
    console.log('TellorStake has been set on tellorMaster')
  }

  main(tellorMaser,)
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });