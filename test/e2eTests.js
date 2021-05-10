// const { artifacts } = require("hardhat");
// const helper = require("./helpers/test_helpers");
// const TestLib = require("./helpers/testLib");
// const Master = artifacts.require("./TellorMaster.sol")
// const Tellor = artifacts.require("./TellorTest.sol")
// const Extension = artifacts.require("./Extension.sol")
// const ITellor = artifacts.require("./ITellor")
// const { stakeAmount } = require("./helpers/constants");
// const hash = web3.utils.keccak256;
// const BN = web3.utils.BN;

// contract("End-to-End Tests", function(accounts) {
//   let master;
//   let env;

//   beforeEach("Setup contract for each test", async function() {
//     this.timeout(30000)
//     tellor = await Tellor.new()
//     oldTellor = await Tellor.new()
//     tellorMaster = await Master.new(tellor.address, oldTellor.address)
//     let extension = await Extension.new()
//     master = await ITellor.at(tellorMaster.address)
//     await master.changeExtension(extension.address)
//     for (var i = 0; i < accounts.length; i++) {
//       //print tokens
//       await master.theLazyCoon(accounts[i], web3.utils.toWei("7000", "ether"));
//       await master.depositStake({from: accounts[i]})
//     }
//     for (let index = 1; index < 50; index++) {
//       await master.addTip(index, index);
//     }
//     await master.theLazyCoon(tellorMaster.address, web3.utils.toWei("70000", "ether"));
//     env = {
//       master: master,
//       accounts: accounts
//     }
//     for (let index = 0; index < 12; index++) {
//       await helper.advanceTime(60 * 60 * 16);
//       await TestLib.mineBlock(env);      
//     }
//   });
//   it("Mine 20 values, a dispute, mine 20 more, settle dispute", async function() {
//     assert(0 ==1)
//   });
//   it("Mine 20 values, upgrade, mine 20 more", async function() {
//     assert(0 ==1)
//   });
//   it("Mine 20 values, upgrade, dispute, mine 20 more, settle dispute", async function() {
//     assert(0 ==1)
//   });
// });
