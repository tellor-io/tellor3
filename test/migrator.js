const { artifacts } = require("hardhat");
const Master = artifacts.require("./TellorMaster.sol")
const Extension = artifacts.require("./Extension.sol")
const Tellor = artifacts.require("./TellorTest.sol")
const ITellor = artifacts.require("./ITellor")
const hash = web3.utils.keccak256;
const helpers = require("./helpers/test_helpers")



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

  it("Can correctly add migrator", async function() {
    await master.changeMigrator(accounts[5]);
    let mig = await master.getAddressVars(hash("_MIGRATOR"))
    assert.equal(mig, accounts[5], "the address should match");
    data3 = await master.decimals();
    assert(data3 - 0 == 18);
  });

  it("Migrator should mint tokens for contract", async() => {
    await master.changeMigrator(accounts[5]);
    let amount = new web3.utils.BN("10000")
    let dummyContract = await Tellor.new()
    await master.migrateContract(dummyContract.address, accounts[2], amount, {from: accounts[5]});
    let balCon = await master.balanceOf(dummyContract.address)
    let balUser = await master.balanceOf(accounts[2])

    assert.isTrue(balCon.toString() == "0", "contract should not have balance")
    assert.isTrue(balUser.eq(amount), "user should have balance")
  })

  it("Shouldn't allow contract to migrate twice", async() => {
    await master.changeMigrator(accounts[5]);
    let amount = new web3.utils.BN("10000")
    let dummyContract = await Tellor.new()
    await master.migrateContract(dummyContract.address, accounts[2], amount, {from: accounts[5]});
    let balCon = await master.balanceOf(dummyContract.address)
    let balUser = await master.balanceOf(accounts[2])

    assert.isTrue(balCon.toString() == "0", "contract should not have balance")
    assert.isTrue(balUser.eq(amount), "user should have balance")

    helpers.expectThrow(master.migrateContract(dummyContract.address, accounts[2], amount, {from: accounts[5]}))
  })

  it("Should allow contract owner to migrate twice", async() => {
    await master.changeMigrator(accounts[5]);
    let amount = new web3.utils.BN("10000")
    let dummyContract = await Tellor.new()
    await master.migrateContract(dummyContract.address, accounts[2], amount, {from: accounts[5]});
    let balCon = await master.balanceOf(dummyContract.address)
    let balUser = await master.balanceOf(accounts[2])

    assert.isTrue(balCon.toString() == "0", "contract should not have balance")
    assert.isTrue(balUser.eq(amount), "user should have balance")

    await master.migrateAddress(accounts[2], amount, {from: accounts[5]})

    let balUser2 = await master.balanceOf(accounts[2])
    assert.isTrue(balUser2.eq(amount.add(amount)), "user should have balance")
  })

  it("Migrator should mint tokens for adddress", async() => {
    await master.changeMigrator(accounts[5]);
    let amount = new web3.utils.BN("10000")
    await master.migrateAddress(accounts[2], amount, {from: accounts[5]});
    let balUser = await master.balanceOf(accounts[2])
    assert.isTrue(balUser.eq(amount), "user should have balance")
  })

   it("Migrator should not mint tokens for adddress twice", async() => {
    await master.changeMigrator(accounts[5]);
    let amount = new web3.utils.BN("10000")
    await master.migrateAddress(accounts[2], amount, {from: accounts[5]});
    let balUser = await master.balanceOf(accounts[2])
    assert.isTrue(balUser.eq(amount), "user should have balance")

    helpers.expectThrow(master.migrateAddress(accounts[2], amount, {from: accounts[5]}))
  })
});
