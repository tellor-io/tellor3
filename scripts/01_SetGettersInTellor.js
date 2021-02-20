//npx hardhat run --network rinkeby scripts/01_SetGettersinTellor.js
/*******************************************************************/

/**********UPDATE DEITY***************************************/

/******************************************************************/
require('dotenv').config()
const helpers = require("./helpers/helpers");
const ethers = require('ethers');
const fetch = require('node-fetch-polyfill')
const path = require("path")
const loadJsonFile = require('load-json-file')
const TellorMaster = artifacts.require("./Tellor.sol");
var tellorMAbi = TellorMaster.abi;

netw = "rinkeby"
//Rinkeby
tellorMaster = '0x88dF592F8eb5D7Bd38bFeF7dEb0fBc02cf3778a0'
gettersAdd = "0x73e34daC4e76BDA81724D333a02d850CA7fBB038"

//mainnet
//tellorMaster = '??'
// gettersAdd = "??"


var _UTCtime = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
var gas_limit = 400000

console.log(_UTCtime)
console.log('https://www.etherchain.org/api/gasPriceOracle')

async function fetchGasPrice() {
    const URL = `https://www.etherchain.org/api/gasPriceOracle`;
    try {
        const fetchResult = fetch(URL);
        const response = await fetchResult;
        const jsonData = await response.json();
        const gasPriceNow = await jsonData.fast * 1;
        const gasPriceNow2 = await (gasPriceNow) * 1000000000;
        return (gasPriceNow2);
    } catch (e) {
        throw Error(e);
    }

}

async function updateDeity(masterAdd,gettersAdd, net ) {
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
        var pubAddr = process.env.PUBLIC_KEY
        var privKey = process.env.PRIVATE_PK
        console.log("infuraKey", infuraKey)
        console.log("Tellor Address: ", tellorMasterAddress)
        console.log("nework", network)

    } catch (error) {
        console.error(error)
        console.log("network error or environment not defined")
        process.exit(1)
    }

    //fetch current gas price
    try {
        var gasP = await fetchGasPrice()
        console.log("gasP", gasP)
    } catch (error) {
        console.error(error)
        console.log("no gas price fetched")
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
        var balNow = ethers.utils.formatEther(await provider.getBalance(pubAddr))
        console.log("Requests Address", pubAddr)
        console.log("Requester ETH Balance", balNow)
        //Change deity
        let tx1 = await contractWithSigner.changeTellorGetters(gettersAdd, { from: pubAddr, gasLimit: gas_limit, gasPrice: gasP });
        var link1 = "".concat(etherscanUrl, '/tx/', tx1.hash)
        await tx1.wait()
        console.log("gettersAddhas been updated to: ", gettersAdd)
       
    } catch (error) {
        console.error(error)
        process.exit(1)
    }
    process.exit()
}
 
updateDeity(tellorMaster, gettersAdd, netw)
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
     }
);