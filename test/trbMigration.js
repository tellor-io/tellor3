const { artifacts } = require("hardhat");
const Master = artifacts.require("./TellorMaster.sol")
const Stake = artifacts.require("./TellorStake.sol")
const Tellor = artifacts.require("./TellorTest.sol")
const ITellor = artifacts.require("./ITellor")


contract("Token Tests", function(accounts) {
  let tellorMaster = {};
  let tellor = {};

  beforeEach("Setup contract for each test", async function() {
    tellor = await Tellor.new()
    oldTellor = await Tellor.new()
    tellorMaster = await Master.new(tellor.address, oldTellor.address)
    let stake = await Stake.new()
    await tellorMaster.changeTellorStake(stake.address)
    master = await ITellor.at(tellorMaster.address)
    for (var i = 0; i < 10; i++) {
      await oldTellor.theLazyCoon(accounts[i], i * web3.utils.toWei("1000", "ether"));
    }
  });
  it("Good Migration - User Balance", async function() {
    for (var i = 0; i < 10; i++) {
      await master.migrate({from:accounts[i]});
      assert(await master.balanceOf(accounts[i]) == i * web3.utils.toWei("1000", "ether"))
    }
  });
  it("Good Migration - Total Supply Changes correctly", async function() {
    let supply = 0
    for (var i = 0; i < 10; i++) {
      await master.migrate({from:accounts[i]});
      supply += i * web3.utils.toWei("1000", "ether");
      assert(await master.totalSupply() == supply, "totalSupply should be corrects")
    }
  });
  it("Migration fails if no balance", async function() {
    await helper.expectThrow(
      await master.migrate({from:accounts[11]}))
    });
    it("Migration fails if trying to migrate twice", async function() {
    for (var i = 0; i < 10; i++) {
      await master.migrate({from:accounts[i]});
      assert(await master.balanceOf(accounts[i]) == i * web3.utils.toWei("1000", "ether"))
    }
    await helper.expectThrow(
      await master.migrate({from:accounts[1]}))
    });
})