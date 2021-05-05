const { artifacts } = require("hardhat");
const Master = artifacts.require("./contracts/TellorMaster.sol")
const Extension = artifacts.require("./Extension.sol")
const Tellor = artifacts.require("./TellorTest.sol")
const ITellor = artifacts.require("./ITellor.sol")
const hash = web3.utils.keccak256;
const BN = web3.utils.BN;
const helper = require("./helpers/test_helpers");

contract("Token Migration and Deity Tests", function(accounts) {
  let tellorMaster = {};
  let tellor = {};
  let baseNum;
  beforeEach("Setup contract for each test", async function() {
    tellor = await Tellor.new()
    oldTellor = await Tellor.new()
    tellorMaster = await Master.new(tellor.address, oldTellor.address)
    let extension = await Extension.new()
master = await ITellor.at(tellorMaster.address)
    await master.changeExtension(extension.address)

    baseNum = new BN(web3.utils.toWei("1000", "ether"))
    for (var i = 0; i < 10; i++) {
      let pay = new BN(i+1);
      await oldTellor.theLazyCoon(accounts[i], pay.mul(baseNum));
      assert(await oldTellor.balanceOf(accounts[i]) - pay.mul(baseNum) == 0)
    }
  });
  it("Good Migration - User Balance", async function() {
    for (var i = 0; i < 10; i++) {
      await master.migrate({from:accounts[i]});
      let pay = new BN(i+1);
      assert(await master.balanceOf(accounts[i]) - pay.mul(baseNum) == 0)
    }
  });
  it("Good Migration - Total Supply Changes correctly", async function() {
    let supply  = 0
    for (var i = 0; i < 10; i++) {
      await master.migrate({from:accounts[i]});
      supply += (i+1);
    }
    pay = new BN(supply)
    assert(await master.totalSupply()- pay.mul(baseNum) == 0, "totalSupply should be corrects")
  });
  it("Migration fails if no balance", async function() {
    await helper.expectThrow(
     master.migrate({from:accounts[11]})
    )
  });
  it("Migration fails if trying to migrate twice", async function() {
    for (var i = 0; i < 10; i++) {
      await master.migrate({from:accounts[i]});
      let pay = new BN(i+1);
      assert(await master.balanceOf(accounts[i]) - pay.mul(baseNum) == 0)
    }
    await helper.expectThrow(master.migrate({from:accounts[1]}))
  });
    it("Migration works if bypass flags", async function() {
    for (var i = 0; i < 10; i++) {
      await master.migrate({from:accounts[i]});
      let pay = new BN(i+1);
      assert(await master.balanceOf(accounts[i]) - pay.mul(baseNum) == 0)
    }
    await helper.expectThrow(
      master.migrate({from:accounts[1]})
    )
  });
  it("Diety tests", async function() {
      newTellor = await Tellor.new()
      extension = await Extension.new()
      master = await ITellor.at(tellorMaster.address)
      await master.changeExtension(extension.address)
      assert(await master.getAddressVars(hash("_EXTENSION")) == extension.address)
      await helper.expectThrow(master.changeExtension(accounts[2],{from:accounts[1]}))
      await tellorMaster.changeOwner(accounts[2])
      assert(await master.getAddressVars(hash("_OWNER")) == accounts[2])
      await tellorMaster.changeTellorContract(newTellor.address)
      assert(await master.getAddressVars(hash("_TELLOR_CONTRACT")) == newTellor.address)
      await tellorMaster.changeDeity(accounts[1])
      assert(await master.getAddressVars(hash("_DEITY")) == accounts[1])
    });
})