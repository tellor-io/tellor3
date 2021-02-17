require("@nomiclabs/hardhat-truffle5");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("@nomiclabs/hardhat-ethers");
require("dotenv").config();

task("deploy", "Deploy and verify the contracts")
  .addParam("oldtellorAddress", "The old master contract address")
  .setAction(async taskArgs => {
    console.log("deploy tellor")
    var oldtellorAddress = taskArgs.oldtellorAddress
    await run("compile");
    const Tellor = await ethers.getContractFactory("Tellor");
    const tellor= await Tellor.deploy();
    console.log("Tellor deployed to:", tellor.address);
    await tellor.deployed();
    console.log("Tellor contract deployed to:", "https://" + taskArgs.network + ".etherscan.io/address/" + contract.address);
    console.log("    transaction hash:", "https://" + taskArgs.network + ".etherscan.io/tx/" + contract.deployTransaction.hash);

    // Wait for few confirmed transactions.
    // Otherwise the etherscan api doesn't find the deployed contract.
    console.log('waiting for tx confirmation...');
    await tellor.deployTransaction.wait(3)

    console.log('submitting for etherscan verification...');

    await run("verify:verify", {
      address: tellor.address,
    },
    )

    console.log("deploy tellorMaster")
    const Master = await ethers.getContractFactory("TellorMaster");
    const master= await Master.deploy(tellor.address,oldtellorAddress);
    console.log("Tellor Master deployed to:", master.address);
    await master.deployed();
    console.log("TellorMaster deployed to:", "https://" + taskArgs.network + ".etherscan.io/address/" + contract.address);
    console.log("    transaction hash:", "https://" + taskArgs.network + ".etherscan.io/tx/" + contract.deployTransaction.hash);

    // Wait for few confirmed transactions.
    // Otherwise the etherscan api doesn't find the deployed contract.
    console.log('waiting for tx confirmation...');
    await master.deployTransaction.wait(3)

    console.log('submitting master for etherscan verification...');

    await run("verify:verify", {
      address: master.address,
      constructorArguments: [tellor.address, oldtellorAddress],
    },
    )


    const Stake = await ethers.getContractFactory("TellorStake");
    const stake = await Stake.deploy();
    console.log("Stake deployed to:", stake.address);
    await tellor.deployed();
    console.log("TellorStake deployed to:", "https://" + taskArgs.network + ".etherscan.io/address/" + contract.address);
    console.log("    transaction hash:", "https://" + taskArgs.network + ".etherscan.io/tx/" + contract.deployTransaction.hash);

    // Wait for few confirmed transactions.
    // Otherwise the etherscan api doesn't find the deployed contract.
    console.log('waiting for tx confirmation...');
    await stake.deployTransaction.wait(3)

    console.log('submitting for etherscan verification...');

    await run("verify:verify", {
      address: stake.address,
    },
    )

  });


/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.7.4",

  networks: {
    hardhat: {
      accounts: {
        mnemonic:
          "nick lucian brenda kevin sam fiscal patch fly damp ocean produce wish",
        count: 40,
      }
    },
      rinkeby: {
        url: `${process.env.NODE_URL_RINKEBY}`,
        accounts: [process.env.PRIVATE_KEY]
      },
      mainnet: {
        url: `${process.env.NODE_URL_MAINNET}`,
        accounts: [process.env.PRIVATE_KEY]
      }  
  },
  etherscan: {
      // Your API key for Etherscan
      // Obtain one at https://etherscan.io/
      apiKey: process.env.ETHERSCAN
    },

};
