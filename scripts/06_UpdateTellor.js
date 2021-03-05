//npx hardhat run --network rinkeby scripts/06_UpdateTellor.js
/*******************************************************************/

/**********Update tellorContract on master, 
            * set extension and getters on Tellor
***************************************/

/******************************************************************/
require('dotenv').config()
const helpers = require("./helpers/helpers");
const ethers = require('ethers');
const fetch = require('node-fetch-polyfill')
const path = require("path")
const loadJsonFile = require('load-json-file')
const Tellor = artifacts.require("./Tellor.sol");
var tellorAbi = Tellor.abi;

netw = "rinkeby"
//Rinkeby
tellorMaster = '0x88dF592F8eb5D7Bd38bFeF7dEb0fBc02cf3778a0'
newTellor = '0x2181c69BF643c3DC66C54164785107207143a2E3'
newExtension = '0x88B58478f5487812d247861635C149A9aCEF1ca5'
newMigrator = ''


var _UTCtime = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
var gas_limit = 400000

console.log(_UTCtime)
console.log('https://www.etherchain.org/api/gasPriceOracle')


async function add58tips(masterAdd, tellorAddr, extAddr, migratorAddr, net ) {
    try {
        if (net == "mainnet") {
            var network = "mainnet"
            var etherscanUrl = "https://etherscan.io"  
        } else if (net == "rinkeby") {
            var network = "rinkeby"
            var etherscanUrl = "https://rinkeby.etherscan.io"
        } else {
           console.log( "network not defined")
        }

        var infuraKey = process.env.WEB3_INFURA_PROJECT_ID
        var tellorAddress = tellorAddr

        console.log("infuraKey", infuraKey)
        console.log("Tellor Address: ", tellorAddress)
        console.log("nework", network)

    } catch (error) {
        console.error(error)
        console.log("network error or environment not defined")
        process.exit(1)
    }


  
    //Get wallet and network ready
    try {
        var provider = ethers.getDefaultProvider(network, infuraKey);
        let wallet = new ethers.Wallet(privKey, provider);
      let tellor = new ethers.Contract(tellorAddress, tellorAbi, provider);
      var tellorWithSigner = tellor.connect(wallet);


    } catch (error) {
        console.error(error)
        console.log("oracle not instantiated")
        process.exit(1)
    }

    try {

        let tx1 = await tellorWithSigner.changeExtension(extAddr);
        var link1 = "".concat(etherscanUrl, '/tx/', tx1.hash)
        await tx1.wait()

        let tx2 = await tellorWithSigner.changeMigrator(migratorAddr);
        var link2 = "".concat(etherscanUrl, '/tx/', tx2.hash)
        await tx2.wait()

       
    } catch (error) {
        console.error(error)
        process.exit(1)
    }

 
    process.exit()
}
 
add58tips(tellorMaster,oldTellor, netw)
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
     }
);