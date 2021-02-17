require("@nomiclabs/hardhat-truffle5");

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
    },
  },
};
