const { artifacts, assert } = require("hardhat");
const Master = artifacts.require("./TellorMaster.sol")
const Extension = artifacts.require("./Extension.sol")
const Tellor = artifacts.require("./TellorTest.sol")
const ITellor = artifacts.require("./ITellor")
const hash = web3.utils.keccak256;
const helpers = require("./helpers/test_helpers")
let amount = new web3.utils.BN("10000")


contract("Migrator Test", function(accounts) {
  let tellorMaster = {};
  let tellor = {};

  beforeEach("Setup contract for each test", async function() {
    tellor = await Tellor.new()
    oldTellor = await Tellor.new()
    tellorMaster = await Master.new(tellor.address, oldTellor.address)
    let extension = await Extension.new()
    master = await ITellor.at(tellorMaster.address)
    await master.changeExtension(extension.address)
  });

  it("Total Supply Should change Properly", async() => {
    let initalSupply = await master.totalSupply.call()
    await master.migrateFor(accounts[2], amount,false);
    let finalSupply = await master.totalSupply.call()
    assert(finalSupply - amount == initalSupply, "total supply should change correctly")
  })

  it("Shouldn't allow contract to migrate twice", async() => {
    await master.migrateFor(accounts[2], amount,false);
    let balUser = await master.balanceOf(accounts[2])
    assert.isTrue(balUser.eq(amount), "user should have balance")
    await helpers.expectThrow(master.migrateFor(accounts[2], amount,false))
  })
  it("Shouldn't allow party to migrate twice if manually input", async() => {
    await master.migrateFor(accounts[2], amount,false);
    let balUser = await master.balanceOf(accounts[2])
    assert.isTrue(balUser.eq(amount), "user should have balance")
    await helpers.expectThrow(master.migrateFor(accounts[2], amount,false))
    await helpers.expectThrow(master.migrate({from:accounts[2]}))
  })
    it("Should allow contract to migrate twice if bypass flag is passed", async() => {
    await master.migrateFor(accounts[2], amount,false);
    await master.migrateFor(accounts[2], amount, true)
    let balUser = await master.balanceOf(accounts[2])
    assert.isTrue(balUser.eq(amount.mul(new web3.utils.BN("2"))), "user should have balance")
  })

  it("Migrator should not mint tokens for adddress twice", async() => {
    await master.migrateFor(accounts[2], amount, false);
    let balUser = await master.balanceOf(accounts[2])
    assert.isTrue(balUser.eq(amount), "user should have balance")
    await helpers.expectThrow(master.migrateFor(accounts[2], amount, false))
  })

  it("Migrator should mint tokens  with bypass flag", async() => {
    await master.migrateFor(accounts[2], amount, false);
    await master.migrateFor(accounts[2], amount, true);
    let balUser = await master.balanceOf(accounts[2])
    assert.isTrue(balUser.eq(amount.mul(new web3.utils.BN("2"))), "user should have balance")
    await helpers.expectThrow(master.migrateFor(accounts[2], amount,false))
  })
  it("Cannot migrate twice", async() => {
    await oldTellor.theLazyCoon(accounts[2], new web3.utils.BN(web3.utils.toWei("1000", "ether")));
    await master.migrateFor(accounts[2], amount, false);
    await helpers.expectThrow(master.migrate({from:accounts[2]}))
  })
  it("Non-deity cannot migrateFor", async() => {
    await helpers.expectThrow(master.migrateFor(accounts[2], amount,false,{from:accounts[2]}))
  })
});
