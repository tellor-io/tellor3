//npx hardhat run --network rinkeby scripts/03_add58tips.js
/*******************************************************************/

/**********MIGRATE and tip 58 requests***************************************/

/******************************************************************/
require('dotenv').config()
const helpers = require("./helpers/helpers");
const ethers = require('ethers');
const fetch = require('node-fetch-polyfill')
const path = require("path")
const loadJsonFile = require('load-json-file')
const Tellor = artifacts.require("./Tellor.sol");
var tellorAbi = Tellor.abi;

//Rinkeby & mainnet
tellorMaster = '0x88dF592F8eb5D7Bd38bFeF7dEb0fBc02cf3778a0'
netw = "mainnet"




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

async function add58tips(masterAdd, net ) {
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

    //fetch current gas price
    try {
        var gasP = await fetchGasPrice()
        console.log("gasP1", gasP)
    } catch (error) {
        console.error(error)
        console.log("no gas price fetched")
        process.exit(1)
    }
  
    //Get wallet and network ready
    try {
        var provider = ethers.getDefaultProvider(network, infuraKey);
        let wallet = new ethers.Wallet(privKey, provider);
      let contract = new ethers.Contract(tellorMasterAddress, tellorAbi, provider);
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
        //before migrate
        var ttbalancestart = ethers.utils.formatEther(await contractWithSigner.balanceOf(pubAddr))
        console.log('before migration Tellor Tributes balance', ttbalancestart)
        if (ttbalancestart ==0){

        let tx1 = await contractWithSigner.migrate({ from: pubAddr, gasLimit: gas_limit, gasPrice: gasP1 });
        var link1 = "".concat(etherscanUrl, '/tx/', tx1.hash)
        await tx1.wait()

        var ttbalanceend = ethers.utils.formatEther(await contractWithSigner.balanceOf(pubAddr))
        console.log('after migration Tellor Tributes balance', ttbalanceend)
        } else{
            
            console.log("already migrated")
        }
       
    } catch (error) {
        console.error(error)
        process.exit(1)
    }

    //add tip if gas is retrieved correctly
    if (gasP != 0 ) {
        console.log("Send request")
        for (var i = 1; i < 59; i++) {
            try {
              var gasP1 = await fetchGasPrice()
              let tx = await contractWithSigner.addTip(i, 1, { from: pubAddr, gasLimit: gas_limit, gasPrice: gasP1 });
              var link = "".concat(etherscanUrl, '/tx/', tx.hash)
              var ownerlink = "".concat(etherscanUrl, '/address/', tellorMasterAddress)
              console.log('Yes, a tip was sent for request id ', i)
              console.log("Hash link: ", link)
              console.log("Contract link: ", ownerlink)
              console.log('Waiting for the transaction to be mined');
              await tx.wait() // If there's an out of gas error the second parameter is the receipt.
        } catch (error) {
            console.error(error)
            process.exit(1)
        }
        
        
        }

    }
    process.exit()
}
 
add58tips(tellorMaster, netw)
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
     }
);