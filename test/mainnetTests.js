// const { expect } = require("chai");
// // const { ethers } = require("hardhat-ethers");

// const devShareWallet = "0x39e419ba25196794b595b2a595ea8e527ddc9856"
// const tellorMaster = "0x0Ba45A8b5d5575935B8158a88C631E9F9C95a2e5"

// describe("All tests", function () {
//     beforeEach(async function () {

//         const oldTellorInstance = await ethers.getContractAt("TellorMaster.sol:TellorMaster", tellorMaster)
//         let fact = await ethers.getContractFactory("contracts/TellorTest.sol:TellorTest");
//         let ext = await ethers.getContractFactory("contracts/Extension.sol:Extension");
//         newTellor = await fact.deploy("Tellor Tribute", "TRB");
//         await newTellor.deployed();
//         newExt = await ext.deploy();
//         await newExt.deployed();
//         const DEV_WALLET = "0x39E419bA25196794B595B2a595Ea8E527ddC9856"
//         await hre.network.provider.request({
//           method: "hardhat_impersonateAccount",
//           params: [DEV_WALLET]
//         })
//         master = oldTellorInstance.connect(await ethers.provider.getSigner(DEV_WALLET))
//         tellor = newTellor.connect(accounts[0])
//         await tellor.changeExtension(extension.address)
//         for(i=0;i<5;i++){
            
//     await master.theLazyCoon(tellorMaster.address, web3.utils.toWei("70000", "ether"));
//     await TestLib.depositStake(env)


//         }
//     });
//     it("MAINNET FORK - mine all 50 values", async function () {
//         assert(0 ==1)
//     })
//     it("MAINNET FORK - mine all 50 values, upgrade Tellor", async function () {
//         assert(0 ==1)
//     });
//     it("MAINNET FORK - dispute a value successfully", async function () {
//         assert(0 =1)
//     });
// });