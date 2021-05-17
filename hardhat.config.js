require("@nomiclabs/hardhat-truffle5");
require("hardhat-gas-reporter");
require('hardhat-contract-sizer');
require("solidity-coverage");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("dotenv").config();
require("@nomiclabs/hardhat-waffle")
//Run this commands to deploy tellor:
//npx hardhat deploy --net rinkeby --network rinkeby
//npx hardhat deploy --net  --network mainnet

// task("deploy", "Deploy and verify the contracts")
//   .addParam("net", "rinkeby or empty for mainnet")
//   .setAction(async taskArgs => {


//     console.log("deploy tellor")
//     var oldtelloraddress = taskArgs.oldtelloraddress
//     var network = taskArgs.net
//     await run("compile");
//     const Tellor = await ethers.getContractFactory("Tellor");
//     const tellor= await Tellor.deploy();
//     console.log("Tellor deployed to:", tellor.address);
//     await tellor.deployed();
//     console.log("Tellor contract deployed to:", "https://" + network + ".etherscan.io/address/" + tellor.address);
//     console.log("    transaction hash:", "https://" + network + ".etherscan.io/tx/" + tellor.deployTransaction.hash);

//     // Wait for few confirmed transactions.
//     // Otherwise the etherscan api doesn't find the deployed contract.
//     console.log('waiting for tx confirmation...');
//     await tellor.deployTransaction.wait(3)

//     console.log('submitting for etherscan verification...');

//     await run("verify:verify", {
//       address: tellor.address,
//     },
//     )

//     console.log("deploy extension")
//     var oldtelloraddress = taskArgs.oldtelloraddress
//     var network = taskArgs.net
//     await run("compile");
//     const Ext = await ethers.getContractFactory("Extension");
//     const extension = await Ext.deploy();
//     console.log("extension  deployed to:", extension.address);
//     await extension.deployed();
//     console.log("Tellor contract deployed to:", "https://" + network + ".etherscan.io/address/" + extension.address);
//     console.log("    transaction hash:", "https://" + network + ".etherscan.io/tx/" + extension.deployTransaction.hash);

//     // Wait for few confirmed transactions.
//     // Otherwise the etherscan api doesn't find the deployed contract.
//     console.log('waiting for tx confirmation...');
//     await extension.deployTransaction.wait(3)

//     console.log('submitting extension for etherscan verification...');

//     await run("verify:verify", {
//       address: extension.address,
//     },
//     )

    // console.log("deploy tellorMaster")
    // const Master = await ethers.getContractFactory("TellorMaster");
    // const master= await Master.deploy(tellor.address,oldtelloraddress);
    // console.log("Tellor Master deployed to:", master.address);
    // await master.deployed();
    // console.log("TellorMaster deployed to:", "https://" + network + ".etherscan.io/address/" + master.address);
    // console.log("    transaction hash:", "https://" + network + ".etherscan.io/tx/" + master.deployTransaction.hash);

    // // Wait for few confirmed transactions.
    // // Otherwise the etherscan api doesn't find the deployed contract.
    // console.log('waiting for tx confirmation...');
    // await master.deployTransaction.wait(3)

    // console.log('submitting master for etherscan verification...');

    // await run("verify:verify", {
    //   address: master.address,
    //   constructorArguments: [tellor.address, oldtelloraddress],
    // },
    // )

    // console.log("deploy tellorGetters")
    // const Getters = await ethers.getContractFactory("TellorGetters");
    // const getters = await Getters.deploy();
    // console.log("Getters deployed to:", getters.address);
    // await getters.deployed();
    // console.log("TellorGetters deployed to:", "https://" + network + ".etherscan.io/address/" + getters.address);
    // console.log("    transaction hash:", "https://" + network + ".etherscan.io/tx/" + getters.deployTransaction.hash);

    // // Wait for few confirmed transactions.
    // // Otherwise the etherscan api doesn't find the deployed contract.
    // console.log('waiting for tx confirmation...');
    // await getters.deployTransaction.wait(3)

    // console.log('submitting for etherscan verification...');

    // await run("verify:verify", {
    //   address: getters.address,
    // },
    // )

    ///instatiate Master with tellor sol before this
    //await master.changeExtension(getters.address)
    //console.log("tellorGetters address updated to", getters.address)

  // });


/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
 solidity: {
    version: "0.7.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 300
      }
    }
  },

  networks: {
    hardhat: {
      accounts: {
        mnemonic:
          "nick lucian brenda kevin sam fiscal patch fly damp ocean produce wish",
        count: 40,
      },
      // forking: {
      //   url: `${process.env.NODE_URL_MAINNET}`
      // },
      allowUnlimitedContractSize: true
    },
      // rinkeby: {
      //   url: `${process.env.NODE_URL_RINKEBY}`,
      //   accounts: [process.env.PRIVATE_KEY],
      //   gas: 10000000 ,
      //   gasPrice: 20000000000
      // },
      // mainnet: {
      //   url: `${process.env.NODE_URL_MAINNET}`,
      //   accounts: [process.env.PRIVATE_KEY],
      //   gas: 10000000 ,
      //   gasPrice: 8000000000
      // }  
  },
  etherscan: {
      // Your API key for Etherscan
      // Obtain one at https://etherscan.io/
      apiKey: process.env.ETHERSCAN
    },
 
    contractSizer: {
      alphaSort: true,
      runOnCompile: true,
      disambiguatePaths: false,
    },

};
