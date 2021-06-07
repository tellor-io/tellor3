// const { AbiCoder } = require("@ethersproject/abi");
// const { expect } = require("chai");
// const { ethers } = require("hardhat");

// function expandTo18Decimals(n) {
//   return ethers.BigNumber.from(n).mul(ethers.BigNumber.from(10).pow(18))
// }

// describe("Tellor", function() {

//     const tellorMaster = "0x88dF592F8eb5D7Bd38bFeF7dEb0fBc02cf3778a0"
//     const DEV_WALLET = "0x39E419bA25196794B595B2a595Ea8E527ddC9856"
  
//   it("should mint Tellor", async function() {

//     const accounts = await ethers.getSigners();
//     const attacker = accounts[1];
//     const user2 = accounts[2];

//     // Take over an account just to give 500 tokens to the attacker
//     await hre.network.provider.request({
//       method: "hardhat_impersonateAccount",
//       params: [DEV_WALLET]}
//     )
//     oldTellorInstance = await ethers.getContractAt("contracts/ITellor.sol:ITellor", tellorMaster)
//     getters = await ethers.getContractAt("contracts/TellorGetters.sol:TellorGetters", tellorMaster)
//     let fact = await ethers.getContractFactory("contracts/Mocks/TellorTest.sol:TellorTest");
//     let ext = await ethers.getContractFactory("contracts/Extension.sol:Extension");
//     newExt = await ext.deploy();
//     await newExt.deployed();
//     newTellor = await fact.deploy(newExt.address);
//     await newTellor.deployed();
//     await hre.network.provider.request({
//       method: "hardhat_impersonateAccount",
//       params: [DEV_WALLET]
//     })
//     await accounts[0].sendTransaction({to:DEV_WALLET,value:ethers.utils.parseEther("1.0")});
//     const devWallet = await ethers.provider.getSigner(DEV_WALLET);
//     master = await oldTellorInstance.connect(devWallet)
//     await master.changeTellorContract(newTellor.address);

//     const tellor = await ethers.getContractAt("ITellor",tellorMaster, devWallet);
//     await tellor.deployed();
//     // Make sure that impersonated address has some tokens
//     expect(await tellor.balanceOf(await devWallet.getAddress())).not.equal(expandTo18Decimals(0));
//     // Check iniitial zero balance
//     expect(await tellor.balanceOf(attacker.address)).equal("0");
//     // Transfer 501 tokens to the attacker
//     await tellor.transfer(attacker.address, expandTo18Decimals(501), {from: devWallet.address});
//     expect(await tellor.balanceOf(attacker.address)).equal(expandTo18Decimals(501));
//     // Become a staker (changes currentStatus to 1)
//     const userTellor = tellor.connect(attacker);
//     await userTellor.depositStake();
//     // Tip any requestId with 2 tokens to make the balance lower than 500
//     expect(userTellor.addTip(1,expandTo18Decimals(2))).to.be.reverted;
//     expect(await tellor.balanceOf(attacker.address)).equal(expandTo18Decimals(501));
//     // Transfer more than 500 tokens to underflow the balance
//     expect(await tellor.balanceOf(user2.address)).equal("0");
//     expect(userTellor.transfer (user2.address, expandTo18Decimals(1000))).to.be.reverted;
//     expect(await tellor.balanceOf(user2.address)).equal(expandTo18Decimals(0));
//   });
// });