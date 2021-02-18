require("@nomiclabs/hardhat-truffle5");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("dotenv").config();

//npx hardhat deploy --oldtelloraddress 0x9FAC705A49e0c8789483c518E71C6483e495ECC4 --network rinkeby

task("deploy", "Deploy and verify the contracts")
  .addParam("oldtelloraddress", "The old master contract address")
  .setAction(async taskArgs => {
    console.log("deploy tellor")
    var oldtelloraddress = taskArgs.oldtelloraddress
    await run("compile");
    const Tellor = await ethers.getContractFactory("Tellor");
    const tellor= await Tellor.deploy();
    console.log("Tellor deployed to:", tellor.address);
    await tellor.deployed();
    console.log("Tellor contract deployed to:", "https://" + taskArgs.network + ".etherscan.io/address/" + tellor.address);
    console.log("    transaction hash:", "https://" + taskArgs.network + ".etherscan.io/tx/" + tellor.deployTransaction.hash);

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
    const master= await Master.deploy(tellor.address,oldtelloraddress);
    console.log("Tellor Master deployed to:", master.address);
    await master.deployed();
    console.log("TellorMaster deployed to:", "https://" + taskArgs.network + ".etherscan.io/address/" + master.address);
    console.log("    transaction hash:", "https://" + taskArgs.network + ".etherscan.io/tx/" + master.deployTransaction.hash);

    // Wait for few confirmed transactions.
    // Otherwise the etherscan api doesn't find the deployed contract.
    console.log('waiting for tx confirmation...');
    await master.deployTransaction.wait(3)

    console.log('submitting master for etherscan verification...');

    await run("verify:verify", {
      address: master.address,
      constructorArguments: [tellor.address, oldtelloraddress],
    },
    )


    const Stake = await ethers.getContractFactory("TellorStake");
    const stake = await Stake.deploy();
    console.log("Stake deployed to:", stake.address);
    await tellor.deployed();
    console.log("TellorStake deployed to:", "https://" + taskArgs.network + ".etherscan.io/address/" + stake.address);
    console.log("    transaction hash:", "https://" + taskArgs.network + ".etherscan.io/tx/" + stake.deployTransaction.hash);

    // Wait for few confirmed transactions.
    // Otherwise the etherscan api doesn't find the deployed contract.
    console.log('waiting for tx confirmation...');
    await stake.deployTransaction.wait(3)

    console.log('submitting for etherscan verification...');

    await run("verify:verify", {
      address: stake.address,
    },
    )

    await master.changeTellorStake(stake.address)
    console.log("tellorStake address updated to", stake.address)
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
