//npx hardhat run --network rinkeby scripts/DeployFullTellorSystem.js
/********************************************************* */

/** Use this script to deploy a full Tellor system if hardhat config fails*/

/******************************************************** */
const { artifacts } = require("hardhat");


const Master = artifacts.require("./TellorMaster.sol")
const Tellor = artifacts.require("./Tellor.sol")
const Getters = artifacts.require("./TellorGetters.sol")


//goerli
oldTellor = '0x639d599545d5bBCb88c28d5B998B64E6AF3e37FF'
//rinkeby
//oldTellor = '0xFe41Cb708CD98C5B20423433309E55b53F79134a'

//mainnet
// oldTellor = '0x0Ba45A8b5d5575935B8158a88C631E9F9C95a2e5'

async function main(_oldTellor) {
    // We get the contract to deploy
    const Tellor = await ethers.getContractFactory("Tellor");
    const tellor= await Tellor.deploy();
    console.log("Tellor deployed to:", tellor.address);

    const Master = await ethers.getContractFactory("TellorMaster");
    const tellorMaster= await Master.deploy(tellor.address, _oldTellor );
    console.log("TellorMaster deployed to:", tellorMaster.address);

    const Getters = await ethers.getContractFactory("TellorGetters");
    const getters = await Getters.deploy( );
    console.log("tellorStake", getters.address)
    await tellorMaster.changeExtension(getters.address)
    console.log('TellorStake has been set on tellorMaster')
  }

  main(oldTellor)
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });