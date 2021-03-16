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
    tellor = await Tellor.new()
    oldTellor = await Tellor.new()
    tellorMaster = await Master.new(tellor.address, oldTellor.address)
    
    let extension = await Extension.new()
    master = await ITellor.at(tellorMaster.address)
    await master.changeExtension(extension.address)

    for (var i = 0; i < accounts.length; i++) {
      //print tokens
      await master.theLazyCoon(accounts[i], web3.utils.toWei("7000", "ether"));
      await master.depositStake({from: accounts[i]})
    }

    env = {
      master: master,
      accounts: accounts
    }

  });

  it("Test New Tellor Storage Contract", async function() {
    let tel = await Tellor.new()
    await master.theLazyCoon(accounts[2], web3.utils.toWei("5000", "ether"))
    await master.proposeFork(tel.address,{from:accounts[2]})
    for (var i = 1; i < 5; i++) {
      await master.vote(1, true,{from:accounts[i]})
    }
    await helper.advanceTime(86400 * 8);
    await master.tallyVotes(1,{from:accounts[5]})
    await helper.advanceTime(86400 * 2);
    await master.updateTellor(1)
    let tea = await master.getAddressVars(hash("_TELLOR_CONTRACT"))
    assert(
      tea ==
        tel.address
    );
  });
  it("Test Failed Vote - New Tellor Storage Contract", async function() {
    await helper.takeFifteen();
    await TestLib.mineBlock(env);
    let oracleBase = await master.getAddressVars(hash("_TELLOR_CONTRACT"));
    await master.theLazyCoon(accounts[6], web3.utils.toWei("1000000", "ether"))
    await  master.proposeFork(add,{from:accounts[2]})
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
  it("Test Failed Vote - New Tellor Storage Contract--vote fail to fail because 10% diff in quorum is not reached", async function() {
    await helper.takeFifteen();
    await TestLib.mineBlock(env);
    let oracleBase = await master.getAddressVars(hash("_TELLOR_CONTRACT"));
    await master.theLazyCoon(accounts[1], web3.utils.toWei("100000", "ether"))
    await master.proposeFork(add,{from:accounts[4]})
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

  it("Test Vote - New Tellor Storage Contract--vote passed by 10% quorum", async function() {
    //print some TRB tokens
    let tel = await Tellor.new()
    await master.theLazyCoon(accounts[4], web3.utils.toWei("4000", "ether"))
    await master.proposeFork(tel.address,{from:accounts[4]})
    //get the initial dispute variables--should be zeros
    await master.vote(1, false)
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
