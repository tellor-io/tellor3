//npx hardhat run --network rinkeby scripts/04_readrequestids.js
/*******************************************************************/

/**********Read request id values**************************************/

/******************************************************************/
require('dotenv').config()
const helpers = require("./helpers/helpers");
const ethers = require('ethers');
const fetch = require('node-fetch-polyfill')
const path = require("path")
const loadJsonFile = require('load-json-file')
const TellorMaster = artifacts.require("./TellorGetters.sol");
var tellorMAbi = TellorMaster.abi;

//Rinkeby
tellorMaster = '0x88dF592F8eb5D7Bd38bFeF7dEb0fBc02cf3778a0'
netw = "mainnet"


var _UTCtime = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
var gas_limit = 100000

console.log(_UTCtime)
console.log('https://www.etherchain.org/api/gasPriceOracle')


async function readreqids(masterAdd,net ) {
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
        var tellorMasterAddress = masterAdd
        var pubAddr = process.env.MIGRATE_PUB
        var privKey = process.env.MIGRATE_PK
        console.log("infuraKey", infuraKey)
        console.log("Tellor Address: ", tellorMasterAddress)
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
      let contract = new ethers.Contract(tellorMasterAddress, tellorMAbi, provider);
      var contractWithSigner = contract.connect(wallet);

    } catch (error) {
        console.error(error)
        console.log("oracle not instantiated")
        process.exit(1)
    }

    try {
        //Read data
        for(i=1;i<59;i++){
            let vars1 = await contractWithSigner.getLastNewValueById(i);
            //var link1 = "".concat(etherscanUrl, '/tx/', vars1.hash)
            //await vars1.wait()
            console.log('Request ID:',i, vars1[0]*1, vars1[1])
        }
       
    } catch (error) {
        console.error(error)
        process.exit(1)
    }
    process.exit()
}
 
readreqids(tellorMaster, netw)
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
     }
);