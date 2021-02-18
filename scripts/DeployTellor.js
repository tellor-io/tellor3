//npx hardhat run --network rinkeby scripts/DeployTellor.js
const { artifacts } = require("hardhat");

const Master = artifacts.require("./TellorMaster.sol")
const Tellor = artifacts.require("./Tellor.sol")
const Stake = artifacts.require("./TellorStake.sol")

//rinkeby
oldTellor = '0xFe41Cb708CD98C5B20423433309E55b53F79134a'

//mainnet
// oldTellor = ''

// module.exports =async function(callback) {

// let tellor = await Tellor.new()
// console.log("tellor", tellor.address)
// let tellorMaster = await Master.new(tellor.address, oldTellor.address)
// console.log("tellorMaster", tellorMaster.address)
// let stake = await Stake.new()
// console.log("tellorStake", tellorStake)
// await tellorMaster.changeTellorStake(stake.address)

// process.exit()


// }

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
    await tellorMaster.changeTellorStake(stake.address)
  }

  main(oldTellor)
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });