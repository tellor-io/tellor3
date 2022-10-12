require("hardhat-gas-reporter");
require('hardhat-contract-sizer');
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("dotenv").config();
const web3 = require('web3');

// npx hardhat run scripts/deployTestEnv.js --network goerli


//goerli
oldTellor = '0x639d599545d5bBCb88c28d5B998B64E6AF3e37FF'

async function deployoldTellor(_network, _pk, _nodeURL) {
    console.log("oldTellor")
    await run("compile")

    var net = _network

    ///////////////Connect to the network
    let privateKey = _pk;
    var provider = new ethers.providers.JsonRpcProvider(_nodeURL)
    let wallet = new ethers.Wallet(privateKey, provider)

    ////////////// Deploy tellor

         //////////////// extension
         console.log("Starting deployment for Extension...")
         const extfac = await ethers.getContractFactory("contracts/Extension.sol:Extension", wallet)
         const ext = await extfac.deploy()
         console.log("ext contract deployed to: ", ext.address)
     
         await ext.deployed()
     
         if (net == "mainnet") {
             console.log("Extension contract deployed to:", "https://etherscan.io/address/" + ext.address);
             console.log("   Extension transaction hash:", "https://etherscan.io/tx/" + ext.deployTransaction.hash);
         } else if (net == "rinkeby") {
             console.log("Extension contract deployed to:", "https://rinkeby.etherscan.io/address/" + ext.address);
             console.log("    Extension transaction hash:", "https://rinkeby.etherscan.io/tx/" + ext.deployTransaction.hash);
         } else if (net == "goerli") {
             console.log("Extension contract deployed to:", "https://goerli.etherscan.io/address/" + ext.address);
             console.log("    Extensionr transaction hash:", "https://goerli.etherscan.io/tx/" + ext.deployTransaction.hash);
         }
         else {
             console.log("Please add network explorer details")
         }
    

    //////////////// Tellor
    console.log("Starting deployment for tellor...")
    const tellorfac = await ethers.getContractFactory("contracts/Tellor.sol:Tellor", wallet)
    const tellor = await tellorfac.deploy(ext.address)
    console.log("Tellor contract deployed to: ", tellor.address)

    await tellor.deployed()

    if (net == "mainnet") {
        console.log("Tellor contract deployed to:", "https://etherscan.io/address/" + tellor.address);
        console.log("   Tellor transaction hash:", "https://etherscan.io/tx/" + tellor.deployTransaction.hash);
    } else if (net == "rinkeby") {
        console.log("Tellor contract deployed to:", "https://rinkeby.etherscan.io/address/" + tellor.address);
        console.log("    Tellor transaction hash:", "https://rinkeby.etherscan.io/tx/" + tellor.deployTransaction.hash);
    } else if (net == "goerli") {
        console.log("Tellor contract deployed to:", "https://goerli.etherscan.io/address/" + tellor.address);
        console.log("    Tellor transaction hash:", "https://goerli.etherscan.io/tx/" + tellor.deployTransaction.hash);
    }
    else {
        console.log("Please add network explorer details")
    }


     //////////////// Tellor master
     console.log("Starting deployment for tellor...")
     const masterfac = await ethers.getContractFactory("contracts/TellorMaster.sol:TellorMaster", wallet)
     const master = await masterfac.deploy(tellor.address, oldTellor)
     console.log("master contract deployed to: ", master.address)
 
     await master.deployed()
 
     if (net == "mainnet") {
         console.log("master contract deployed to:", "https://etherscan.io/address/" + master.address);
         console.log("   Master transaction hash:", "https://etherscan.io/tx/" + master.deployTransaction.hash);
     } else if (net == "rinkeby") {
         console.log("Master contract deployed to:", "https://rinkeby.etherscan.io/address/" + master.address);
         console.log("    Master transaction hash:", "https://rinkeby.etherscan.io/tx/" + master.deployTransaction.hash);
     } else if (net == "goerli") {
         console.log("Master contract deployed to:", "https://goerli.etherscan.io/address/" + master.address);
         console.log("    Master transaction hash:", "https://goerli.etherscan.io/tx/" + master.deployTransaction.hash);
     }
     else {
         console.log("Please add network explorer details")
     }






//////////////Verify

 
// Wait for few confirmed transactions.
    // Otherwise the etherscan api doesn't find the deployed contract.
    console.log('waiting for tellor tx confirmation...');
    await tellor.deployTransaction.wait(7)

    console.log('submitting contract for verification...');
    await run("verify:verify",
        {
            address: tellor.address,
            constructor: [ext.address]
        },
    )
    console.log("tellor contract verified")

    // Wait for few confirmed transactions.
    // Otherwise the etherscan api doesn't find the deployed contract.
    console.log('waiting for Master tx confirmation...');
    await master.deployTransaction.wait(7)

    console.log('submitting contract for verification...');
    await run("verify:verify",
        {
            address: master.address,
            constructor: [tellor.address,oldTellor ]
        },
    )
    console.log("master contract verified")

       // Wait for few confirmed transactions.
    // Otherwise the etherscan api doesn't find the deployed contract.
    console.log('waiting for ext tx confirmation...');
    await ext.deployTransaction.wait(7)

    console.log('submitting contract for verification...');
    await run("verify:verify",
        {
            address: ext.address
        },
    )
    console.log("ext contract verified")
    


}


deployoldTellor("goerli", process.env.TESTNET_PK, process.env.NODE_URL_GOERLI)
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });