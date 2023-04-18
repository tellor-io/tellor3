//npx hardhat run --network rinkeby scripts/DeployFullTellorSystem.js
/********************************************************* */

/** Use this script to deploy a full Tellor system if hardhat config fails*/

/******************************************************** */
const { artifacts } = require("hardhat");


//const Master = artifacts.require("./TellorMaster.sol")
//const Tellor = artifacts.require("./Tellor.sol")
//const Getters = artifacts.require("./TellorGetters.sol")

//npx hardhat run scripts/DeployFullTellorSystem.js --network sepolia

//mainnet
// oldTellor = '0x0Ba45A8b5d5575935B8158a88C631E9F9C95a2e5'

async function main() {
  await run("compile")
  
  var net = hre.network.name

  try {
    if (net == "sepolia") {
        var network = "sepolia"
        var explorerUrl = "https://sepolia.etherscan.io/address/"
        var pubAddr = process.env.TESTNET_PUBLIC
        var privateKey = process.env.TESTNET_PK
        var provider = new ethers.providers.JsonRpcProvider(process.env.NODE_URL_SEPOLIA)
        var _teamMultisigAddress = '0x34Fae97547E990ef0E05e05286c51E4645bf1A85'
    }
  } catch (error) {
    console.error(error)
    console.log("network error or environment not defined")
    process.exit(1)
}
  console.log(network, pubAddr)
  let wallet = new ethers.Wallet(privateKey, provider)

    //Deploy Old tellor
    console.log("Starting deployment for oldTellor contract...")
    const OldTellor = await ethers.getContractFactory("OldTellor", wallet)
    const oldtellor= await OldTellor.deploy()
    console.log("OldTellor deployed to:", oldtellor.address)
    console.log(explorerUrl + oldtellor.address)
    
    
    //Deploy extenstion contract
    console.log("Starting deployment for extension  contract...")
    const Extension = await ethers.getContractFactory("Extension", wallet)
    const ext= await Extension.deploy()
    console.log("Extension deployed to:", ext.address)
    console.log(explorerUrl + ext.address)

    //Deploy Tellor3 which includes the extenstion contract
    console.log("Starting deployment for tellor3 contract...")
    const Tellor = await ethers.getContractFactory("Tellor", wallet)
    const tellor= await Tellor.deploy(ext.address)
    console.log("Tellor3 deployed to:", tellor.address)
    console.log(explorerUrl + tellor.address)

    //Deploy Tellor master
    console.log("Starting deployment for Master(token) contract...")
    const Master = await ethers.getContractFactory("TellorMaster", wallet)
    const tellorMaster= await Master.deploy(tellor.address, oldtellor.address)
    console.log("TellorMaster deployed to:", tellorMaster.address)
    console.log(explorerUrl + tellorMaster.address)

    // verification starting
    console.log('waiting for oldTellor tx confirmation...')
    await oldtellor.deployTransaction.wait(7)
    console.log('submitting contract for verification...')

    try {
        await run("verify:verify",
            {
                address: oldtellor.address,
            },
        )
        console.log("Oldtellor contract verified")
    } catch (e) {
        console.log(e)
    }

    console.log('waiting for extenstion tx confirmation...');
    await ext.deployTransaction.wait(7)
    console.log('submitting contract for verification...');

    try {
        await run("verify:verify",
            {
                address: ext.address,

            },
        )
        console.log("Extension contract verified")
    } catch (e) {
        console.log(e)
    }

    console.log('waiting for tellor3 tx confirmation...');
    await tellor.deployTransaction.wait(7)
    console.log('submitting contract for verification...');

    try {
        await run("verify:verify",
            {
                address: tellor.address,
                constructorArguments: [ext.address]
            },
        )
        console.log("Tellor3 contract verified")
    } catch (e) {
        console.log(e)
    }

    console.log('waiting for Tellor Master tx confirmation...');
    await tellorMaster.deployTransaction.wait(7)
    console.log('submitting contract for verification...');

    try {
        await run("verify:verify",
            {
                address: tellorMaster.address,
                constructorArguments: [tellor.address, oldtellor.address]
            },
        )
        console.log("Tellor Master contract verified")
    } catch (e) {
        console.log(e)
    }



  }

  main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });