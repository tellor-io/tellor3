//npx hardhat run --network rinkeby scripts/03_trymigrate.js
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

netw = "rinkeby"
//Rinkeby
tellorMaster = '0x4756942F9B7c3824bBAb8F61ea536033FfD9BcD4'
oldTellor = '0xFe41Cb708CD98C5B20423433309E55b53F79134a'


//mainnet
//tellorMaster = ''
//oldTellor = '0x0Ba45A8b5d5575935B8158a88C631E9F9C95a2e5'

//Address to migrate with old tellor balance--SHOULD GO THROUGH
var pubAddr = process.env.MIGRATE_PUB
var privKey = process.env.MIGRATE_PK

//Address to migrate without old tellor balance- SHOULD FAIL
// var pubAddr = process.env.PUBLIC_KEY
// var privKey = process.env.PRIVATE_KEY


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

async function add58tips(masterAdd, oldMasterAdd, net ) {
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
        var oldTellorMaster = oldMasterAdd

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

      let oldcontract = new ethers.Contract(oldTellorMaster, tellorAbi, provider);
      var oldcontractWithSigner = oldcontract.connect(wallet);

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
        //balance on old contract
        var oldttbalancestart = ethers.utils.formatEther(await oldcontractWithSigner.balanceOf(pubAddr))
        console.log('old Tellor Tributes balance', oldttbalancestart)
        //balance on new contract
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

 
    process.exit()
}
 
add58tips(tellorMaster,oldTellor, netw)
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
     }
);