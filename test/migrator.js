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
    await master.migrateFrom(dummyContract.address, accounts[2], amount, {from: accounts[5]});
    let balCon = await master.balanceOf(dummyContract.address)
    let balUser = await master.balanceOf(accounts[2])

    assert.isTrue(balCon.toString() == "0", "contract should not have balance")
    assert.isTrue(balUser.eq(amount), "user should have balance")
  })

  it("Migrator should batch mint tokens for contract", async() => {
    await master.changeMigrator(accounts[5]);
    let amount = new web3.utils.BN("10000")
    let dummyContract1 = await Tellor.new()
    let dummyContract2 = await Tellor.new()
    await master.migrateFromBatch([dummyContract1.address,dummyContract2.address], [accounts[2], accounts[3]],[amount, amount], {from: accounts[5]});
    let balCon1 = await master.balanceOf(dummyContract1.address)
    let balUser1 = await master.balanceOf(accounts[2])

    let balCon2 = await master.balanceOf(dummyContract2.address)
    let balUser2 = await master.balanceOf(accounts[3])

    assert.isTrue(balCon1.toString() == "0", "contract should not have balance")
    assert.isTrue(balUser1.eq(amount), "user should have balance")
    assert.isTrue(balCon2.toString() == "0", "contract should not have balance")
    assert.isTrue(balUser2.eq(amount), "user should have balance")
  })

  it("Shouldn't allow contract to migrate twice", async() => {
    await master.changeMigrator(accounts[5]);
    let amount = new web3.utils.BN("10000")
    let dummyContract = await Tellor.new()
    await master.migrateFrom(dummyContract.address, accounts[2], amount, {from: accounts[5]});
    let balCon = await master.balanceOf(dummyContract.address)
    let balUser = await master.balanceOf(accounts[2])

    assert.isTrue(balCon.toString() == "0", "contract should not have balance")
    assert.isTrue(balUser.eq(amount), "user should have balance")

    helpers.expectThrow(master.migrateFrom(dummyContract.address, accounts[2], amount, {from: accounts[5]}))
  })

  it("Should allow contract owner to migrate twice", async() => {
    await master.changeMigrator(accounts[5]);
    let amount = new web3.utils.BN("10000")
    let dummyContract = await Tellor.new()
    await master.migrateFrom(dummyContract.address, accounts[2], amount, {from: accounts[5]});
    let balCon = await master.balanceOf(dummyContract.address)
    let balUser = await master.balanceOf(accounts[2])

    assert.isTrue(balCon.toString() == "0", "contract should not have balance")
    assert.isTrue(balUser.eq(amount), "user should have balance")

    await master.migrateFor(accounts[2], amount, {from: accounts[5]})

    let balUser2 = await master.balanceOf(accounts[2])
    assert.isTrue(balUser2.eq(amount.add(amount)), "user should have balance")
  })

  it("Migrator should mint tokens for address", async() => {
    await master.changeMigrator(accounts[5]);
    let amount = new web3.utils.BN("10000")
    await master.migrateFor(accounts[2], amount, {from: accounts[5]});
    let balUser = await master.balanceOf(accounts[2])
    assert.isTrue(balUser.eq(amount), "user should have balance")
  })

   it("Migrator should mint tokens for address", async() => {
    await master.changeMigrator(accounts[5]);
    let amount = new web3.utils.BN("10000")
    await master.migrateForBatch([accounts[2], accounts[3]], [amount, amount], {from: accounts[5]});
    let balUser = await master.balanceOf(accounts[2])
    let balUser2 = await master.balanceOf(accounts[3])
    assert.isTrue(balUser.eq(amount), "user should have balance")
    assert.isTrue(balUser2.eq(amount), "user should have balance")
  })

  it("Migrator should not mint tokens for adddress twice", async() => {
    await master.changeMigrator(accounts[5]);
    let amount = new web3.utils.BN("10000")
    await master.migrateFor(accounts[2], amount, {from: accounts[5]});
    let balUser = await master.balanceOf(accounts[2])
    assert.isTrue(balUser.eq(amount), "user should have balance")

    helpers.expectThrow(master.migrateFor(accounts[2], amount, {from: accounts[5]}))
  })

  it("Should not mint tokens with mismatched input address", async() => {
    await master.changeMigrator(accounts[5]);
    let amount = new web3.utils.BN("10000")
    helpers.expectThrow(master.migrateForBatch([accounts[2], accounts[3]], [amount, amount, amount], {from: accounts[5]}))
    helpers.expectThrow(master.migrateFromBatch([accounts[2], accounts[3], accounts[4]], [accounts[2], accounts[3]], [amount], {from: accounts[5]}))
  })
});
