//npx hardhat run --network rinkeby scripts/DeployTellor.js
/********************************************************* */

/** Use this script to deploy a full Tellor system if hardhat config fails*/

/******************************************************** */
const { artifacts } = require("hardhat");

const Master = artifacts.require("./TellorMaster.sol")
const Tellor = artifacts.require("./Tellor.sol")
const Getters = artifacts.require("./TellorGetters.sol")

//rinkeby
oldTellor = '0xFe41Cb708CD98C5B20423433309E55b53F79134a'

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

    const Stake = await ethers.getContractFactory("TellorStake");
    const stake = await Stake.deploy( );
    console.log("tellorStake", stake.address)
    await tellorMaster.changeTellorGetters(getter.address)
    console.log('TellorStake has been set on tellorMaster')
  }

  main(oldTellor)
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });