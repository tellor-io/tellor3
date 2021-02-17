require("@nomiclabs/hardhat-truffle5");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("@nomiclabs/hardhat-ethers");

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.7.4",

  networks: {
    hardhat: {
      accounts: {
        count: 40,
      },
      forking: {
        url: `${process.env.NODE_URL_MAINNET}`,
        blockNumber: 11868228,
      }
    },
  },
};
