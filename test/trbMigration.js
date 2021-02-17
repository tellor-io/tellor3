const { artifacts } = require("hardhat");
const Master = artifacts.require("./contracts/TellorMaster.sol")
const Stake = artifacts.require("./TellorStake.sol")
const Tellor = artifacts.require("./TellorTest.sol")
const ITellor = artifacts.require("./ITellor.sol")
const hash = web3.utils.keccak256;
const BN = web3.utils.BN;

contract("Token Migration and Deity Tests", function(accounts) {
  let tellorMaster = {};
  let tellor = {};
  let baseNum;
  beforeEach("Setup contract for each test", async function() {
    tellor = await Tellor.new()
    oldTellor = await Tellor.new()
    tellorMaster = await Master.new(tellor.address, oldTellor.address)
    let stake = await Stake.new()
    await tellorMaster.changeTellorStake(stake.address)
    master = await ITellor.at(tellorMaster.address)
    baseNum = new BN(web3.utils.toWei("1000", "ether"))
    for (var i = 0; i < 10; i++) {
      let pay = new BN(i);
      await oldTellor.theLazyCoon(accounts[i], pay.mul(baseNum));
    }
  });
  it("Good Migration - User Balance", async function() {
    for (var i = 0; i < 10; i++) {
      await master.migrate({from:accounts[i]});
      let pay = new BN(i);
      assert(await master.balanceOf(accounts[i]) == pay.mul(baseNum))
    }
  });
  it("Good Migration - Total Supply Changes correctly", async function() {
    let supply = 0
    for (var i = 0; i < 10; i++) {
      await master.migrate({from:accounts[i]});
      let pay = new BN(i);
      supply += pay.mul(baseNum);
      assert(await master.totalSupply() == supply, "totalSupply should be corrects")
    }
  });
  it("Migration fails if no balance", async function() {
    await helper.expectThrow(
     master.migrate({from:accounts[11]}))
    });
    it("Migration fails if trying to migrate twice", async function() {
    for (var i = 0; i < 10; i++) {
      await master.migrate({from:accounts[i]});
      let pay = new BN(i);
      assert(await master.balanceOf(accounts[i]) == pay.mul(baseNum))
    }
    await helper.expectThrow(
      master.migrate({from:accounts[1]})
    )
    });
    it("Diety tests", async function() {
      newTellor = await Tellor.new()
      newStake = await Stake.new()
      await tellorMaster.changeTellorStake(newStake)
      assert(await master.getAddressVars(hash("tellorStake")) == newStake.address)
      await tellorMaster.changeOwner(accounts[2])
      assert(await master.getAddressVars(hash("_owner")) == accounts[2])
      await tellorMaster.changeTellorContract(newTellor.address)
      assert(await master.getAddressVars(hash("tellorContract")) == newTellor.address)
      await tellorMaster.changeDeity(accounts[1])
      assert(await master.getAddressVars(hash("_deity")) == accounts[1])
    });
})