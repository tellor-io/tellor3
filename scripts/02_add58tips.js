/*******************************************************************/

/**********TEST MIGRATIONS ***************************************/

/******************************************************************/
require('dotenv').config()
const helper = require("./helpers/helpers");
const ethers = require('ethers');
const fetch = require('node-fetch-polyfill')
const path = require("path")
const loadJsonFile = require('load-json-file')

//Rinkby
tellorMaster = ''

//mainnet
//tellorMaster = ''


var _UTCtime = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
var gas_limit = 400000

console.log(_UTCtime)
console.log('https://www.etherchain.org/api/gasPriceOracle')

async function addtips(masterAdd, net ) {
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

        var infuraKey = process.env.INFURA_TOKEN
        var tellorMasterAddress = masterAdd
        var pubAddr = process.env.PUBLIC_KEY
        var privKey = process.env.PRIVATE_KEY
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
        var gasP = await helpers.fetchGasPrice()
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
        let abi = await loadJsonFile(path.join("abi", "tellor.json"))
      let contract = new ethers.Contract(tellorMasterAddress, abi, provider);
      var contractWithSigner = contract.connect(wallet);

    } catch (error) {
        console.error(error)
        console.log("oracle not instantiated")
        process.exit(1)
    }

    //add tip if gas is retrieved correctly
    if (gasP != 0 ) {
        console.log("Send request")
        for (var i = 1; i < 58; i++) {
            try {
              var gasP = await helpers.fetchGasPrice()
              let tx = await contractWithSigner.addTip(i, 1, { from: pubAddr, gasLimit: gas_limit, gasPrice: gasP });
              var link = "".concat(etherscanUrl, '/tx/', tx.hash)
              var ownerlink = "".concat(etherscanUrl, '/address/', tellorMasterAddress)
              console.log('Yes, a request was sent for the APML price')
              console.log("Hash link: ", link)
              console.log("Contract link: ", ownerlink)
              console.log('Waiting for the transaction to be mined');
              await tx.wait() // If there's an out of gas error the second parameter is the receipt.
        } catch (error) {
            console.error(error)
            process.exit(1)
        }
        console.log( requId, " reqId was tipped")
        process.exit()
        }
    }

 
addTips58(tellorMaster)
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
     }
);