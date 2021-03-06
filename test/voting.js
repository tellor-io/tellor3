const { artifacts } = require("hardhat");
const helper = require("./helpers/test_helpers");
const TestLib = require("./helpers/testLib");

const Master = artifacts.require("./TellorMaster.sol")
const Extension = artifacts.require("./Extension.sol")
const Tellor = artifacts.require("./TellorTest.sol")
const ITellor = artifacts.require("./ITellor")
const hash = web3.utils.keccak256;


contract("Voting Tests", function(accounts) {
  let master;
  let env;
  let add = "0xEA674fdDe714fd979de3EdF0F56AA9716B898ec8"

  let tellorMaster = {};
  let tellor = {};

  beforeEach("Setup contract for each test", async function() {
    let extension = await Extension.new()
    tellor = await Tellor.new(extension.address)
    oldTellor = await Tellor.new(extension.address)
    tellorMaster = await Master.new(tellor.address, oldTellor.address)
    master = await ITellor.at(tellorMaster.address)
    for (var i = 0; i < accounts.length; i++) {
      await master.theLazyCoon(accounts[i], web3.utils.toWei("7000", "ether"));
      await master.depositStake({from: accounts[i]})
    }
    env = {
      master: master,
      accounts: accounts
    }
  });
  it("Test New Tellor Storage Contract", async function() {
    let newExtension = await Extension.new()
    let tel = await Tellor.new(newExtension.address)
    await tel.bumpVersion();
    await master.theLazyCoon(accounts[2], web3.utils.toWei("5000", "ether"))
    await master.proposeFork(tel.address,{from:accounts[2]})
    for (var i = 1; i < 5; i++) {
      await master.vote(1, true,{from:accounts[i]})
    }
    await helper.advanceTime(86400 * 8);
    await master.tallyVotes(1,{from:accounts[5]})
    await helper.expectThrow(master.updateTellor(1))//not enough time has passed
    await helper.advanceTime(86400 * 2);
    await master.updateTellor(1)
    let tea = await master.getAddressVars(hash("_TELLOR_CONTRACT"))
    assert(
      tea ==
        tel.address
    );
    await helper.expectThrow(master.updateTellor(1))//already has been executed
    await helper.expectThrow(master.unlockDisputeFee(1, { from: accounts[0] }));//not callable on forks
    
  });
  it("Test Failed Vote - New Tellor Storage Contract", async function() {
    let newExtension = await Extension.new()
    let tel = await Tellor.new(newExtension.address)
    await tel.bumpVersion();
    await helper.takeFifteen();
    await TestLib.mineBlock(env);
    let oracleBase = await master.getAddressVars(hash("_TELLOR_CONTRACT"));
    await master.theLazyCoon(accounts[6], web3.utils.toWei("1000000", "ether"))
    await helper.expectThrow(master.proposeFork(accounts[3],{from:accounts[2]}))//a non-valid tellor addy
    await  master.proposeFork(tel.address,{from:accounts[2]})
    for (var i = 1; i < 5; i++) {
      await master.vote(1, false,{from:accounts[i]})
    }
    await helper.advanceTime(86400 * 8);
    await master.tallyVotes(1,{from:accounts[5]})
    await helper.advanceTime(86400 * 2);
    await helper.expectThrow(master.updateTellor(1))
    var newAddy = await master.getAddressVars(hash("_TELLOR_CONTRACT"))
    assert(newAddy == oracleBase,"vote should have failed");
  });
  it("Test Verify", async function() {
    let newExtension = await Extension.new()
    let tel = await Tellor.new(newExtension.address)
  await tel.bumpVersion();
  assert(await tel.verify() == 3001, "version should be correct")
  });
  it("Test Failed Vote - New Tellor Storage Contract--vote fail to fail because 5% diff in quorum is not reached", async function() {
    let newExtension = await Extension.new()
    let tel = await Tellor.new(newExtension.address)
    await tel.bumpVersion();
    await helper.takeFifteen();
    await TestLib.mineBlock(env);
    let oracleBase = await master.getAddressVars(hash("_TELLOR_CONTRACT"));
    await master.theLazyCoon(accounts[1], web3.utils.toWei("100000", "ether"))
    await master.proposeFork(tel.address,{from:accounts[4]})
    vars = await master.getAllDisputeVars(1);
    await master.vote(1, false)
    vars = await master.getAllDisputeVars(1);
    await helper.advanceTime(86400 * 8);
     await master.tallyVotes(1,{from:accounts[5]})
    await helper.advanceTime(86400 * 2);
    await helper.expectThrow(master.updateTellor(1))
    var newAddy = await master.getAddressVars(hash("_TELLOR_CONTRACT"))
    assert(newAddy == oracleBase,"vote should have failed");
  });

  it("Test Vote - New Tellor Storage Contract--vote passed by 5% quorum", async function() {
    let newExtension = await Extension.new()
    let tel = await Tellor.new(newExtension.address)
    await tel.bumpVersion();
    await master.theLazyCoon(accounts[4], web3.utils.toWei("4000", "ether"))
    await master.proposeFork(tel.address,{from:accounts[4]})
    await master.vote(1, false)
    await master.vote(1, true,{from:accounts[4]})
    await master.vote(1, true,{from:accounts[1]})
    await master.vote(1, true,{from:accounts[3]})
    await master.vote(1, true,{from:accounts[9]})
    await helper.advanceTime(86400 * 8);
    await master.tallyVotes(1)
    await helper.advanceTime(86400 * 2);
    await master.updateTellor(1)
    let madd = await master.getAddressVars(hash("_TELLOR_CONTRACT"));
    assert(
      madd == tel.address,
      "vote should have passed"
    );
  });
});
