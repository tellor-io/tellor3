// const { expect } = require("chai");
// const { web3 } = require("hardhat");
// //const { ethers } = require("@nomiclabs/hardhat-ethers");
// const TestLib = require("./helpers/testLib");
// const helper = require("./helpers/test_helpers");
// const DEV_WALLET = "0x39E419bA25196794B595B2a595Ea8E527ddC9856"
// const tellorMaster = "0x88dF592F8eb5D7Bd38bFeF7dEb0fBc02cf3778a0"
// var evmCurrentBlockTime = Math.round((Number(new Date().getTime())) / 1000);
// const hash = web3.utils.keccak256;
// let provider = ethers.getDefaultProvider();
// let oldTellorInstance
// let master;
// let devWallet
// let accounts;

// const takeFifteen = async () => {
//     evmCurrentBlockTime = evmCurrentBlockTime + 16*60
//     await waffle.provider.send("evm_setNextBlockTimestamp", [evmCurrentBlockTime]);
//     await waffle.provider.send("evm_mine");
//   };


// describe("Mainnet tests", function () {
//     beforeEach(async function () {
//           await hre.network.provider.request({
//             method: "hardhat_reset",
//             params: [{forking: {
//                   jsonRpcUrl: hre.config.networks.hardhat.forking.url,
//                   blockNumber:12427825
//                 },},],
//             });
//         accounts = await ethers.getSigners();
//         oldTellorInstance = await ethers.getContractAt("contracts/ITellor.sol:ITellor", tellorMaster)
//         getters = await ethers.getContractAt("contracts/TellorGetters.sol:TellorGetters", tellorMaster)
//         let fact = await ethers.getContractFactory("contracts/Mocks/TellorTest.sol:TellorTest");
//         let ext = await ethers.getContractFactory("contracts/Extension.sol:Extension");
//         newExt = await ext.deploy();
//         await newExt.deployed();
//         newTellor = await fact.deploy(newExt.address);
//         await newTellor.deployed();
//         await hre.network.provider.request({
//           method: "hardhat_impersonateAccount",
//           params: [DEV_WALLET]
//         })
//         await accounts[0].sendTransaction({to:DEV_WALLET,value:ethers.utils.parseEther("1.0")});
//         devWallet = await ethers.provider.getSigner(DEV_WALLET)
//         for(i=0;i<5;i++){
//             master = await oldTellorInstance.connect(devWallet)
//             await master.transfer(accounts[i].address,BigInt(1000e18))
//             master = await oldTellorInstance.connect(accounts[i])
//             await master.depositStake()
//         }
//         master = await oldTellorInstance.connect(devWallet)
//         await master.changeTellorContract(newTellor.address);
//     });
//     it("MAINNET FORK - mine all 50 values", async function () {
//         this.timeout(3000000)
//         const oldTellorInstance = await ethers.getContractAt("contracts/ITellor.sol:ITellor", tellorMaster)
//         for(i = 0; i<50;i++){
//             await takeFifteen()
//             for(j=0;j<5;j++){
//                 let vars = await master.getNewCurrentVariables();
//                 master = await oldTellorInstance.connect(accounts[j])
//                 await master.testSubmitMiningSolution(
//                     "nonce",vars["_requestIds"],[i, i+1, i+2, i+3, i+4]);
//             }
//         }
//     }).timeout(3000000)
//     it("MAINNET FORK - mine 10 values, upgrade Tellor", async function () {
//         const oldTellorInstance = await ethers.getContractAt("contracts/ITellor.sol:ITellor", tellorMaster)
//         for (let index = 1; index < 50; index++) {
//             await master.addTip(index, index);
//           }
//         for(i = 0; i<10;i++){
//             await takeFifteen()
//             for(j=0;j<5;j++){
//                 let vars = await master.getNewCurrentVariables();
//                 master = await oldTellorInstance.connect(accounts[j])
//                 await master.testSubmitMiningSolution(
//                     "nonce",vars["_requestIds"],[i, i+1, i+2, i+3, i+4]);
//             }
//         }
//         for(j=0;j<5;j++){
//             master = await oldTellorInstance.connect(accounts[j])
//             await master.theLazyCoon(accounts[j].address,ethers.utils.parseEther("200000"))
//         }
//         let fact = await ethers.getContractFactory("contracts/Mocks/TellorTest.sol:TellorTest");
//         let ext = await ethers.getContractFactory("contracts/Extension.sol:Extension");
//         newExt = await ext.deploy();
//         await newExt.deployed();
//         newTellor = await fact.deploy(newExt.address);
//         await newTellor.deployed();
//         await newTellor.bumpVersion();
//         await master.proposeFork(newTellor.address)
//         dispInfo = await master.getAllDisputeVars(1);
//         for(j=0;j<5;j++){
//             master = await oldTellorInstance.connect(accounts[j])
//             await master.vote(1,true)
//         }
//         master = await oldTellorInstance.connect(devWallet)
//         await master.vote(1,true)
//         await helper.advanceTime(86400 * 8);
//         await master.tallyVotes(1)
//         dispInfo = await master.getAllDisputeVars(1);
//         await helper.advanceTime(86400 * 2);
//         await master.updateTellor(1)
//         let madd = await master.getAddressVars(hash("_TELLOR_CONTRACT"));
//         assert(
//           madd == newTellor.address,
//           "vote should have passed"
//         );
//     }).timeout(3000000);
//     it("MAINNET FORK - dispute a value successfully", async function () {
//         let vars;
//         let vars2 = await master.getNewCurrentVariables();
//         for(count = 0;count<3;count++){
//             for(j=0;j<5;j++){
//                 values = [3000,3300+j,1,2,3];
//                 vars = await master.getNewCurrentVariables();
//                 if(vars2[0] != vars[0]){
//                     await takeFifteen();
//                     if (count == 1){
//                         vars2 == await master.getNewCurrentVariables();
//                     }
//                 }
//                 master = await oldTellorInstance.connect(accounts[j])
//                 await master.testSubmitMiningSolution("nonce",vars["_requestIds"],values);
//             }
//         }
//         count = await master.getNewValueCountbyRequestId(vars2["_requestIds"][1]);
//         let timestamp = await master.getTimestampbyRequestIDandIndex(
//             vars2["_requestIds"][1],
//         count.toNumber() - 1
//         );
//         master = await oldTellorInstance.connect(accounts[2])
//       await master.beginDispute(vars2["_requestIds"][1], timestamp,1);
//       balance1 = await master.balanceOf(accounts[1].address);
//       dispBal1 = await master.balanceOf(accounts[2].address);
//       count = await master.getUintVar(web3.utils.keccak256("_DISPUTE_COUNT"));
//       master = await oldTellorInstance.connect(accounts[3])
//       await master.vote(1, true);
//       await helper.advanceTime(86400 * 22);   
//       await master.tallyVotes(1);
//       await helper.advanceTime(86400 * 2);
//       await master.unlockDisputeFee(1);
//       dispInfo = await master.getAllDisputeVars(1);
//       assert(dispInfo[7][0] - vars2["_requestIds"][1] == 0, "request id should be right");
//       assert(dispInfo[7][2] - 3301 == 0, "value submited should be right");
//       assert(dispInfo[2] == true, "Dispute Vote passed");
//       voted = await master.didVote(1, accounts[3].address);
//       assert(voted == true, "account 3 voted");
//       voted = await master.didVote(1, accounts[5].address);
//       assert(voted == false, "account 5 did not vote");
//       balance2 = await master.balanceOf(accounts[1].address);
//       dispBal2 = await master.balanceOf(accounts[2].address);
//       assert(
//         balance1-balance2 == ethers.utils.parseEther("500"),
//         "reported miner's balance should change correctly"
//       );
//       dispChange = dispBal2-dispBal1;
//       feeStake = ethers.utils.parseEther("500")*1 + dispInfo[7][8]*1
//       expect(dispChange).to.be.closeTo(feeStake, 700000000000)
//       s = await master.getStakerInfo(accounts[2].address);
//       assert(s != 1, " Not staked");
//     }).timeout(3000000);
// });