const { artifacts } = require("hardhat");
const helper = require("./helpers/test_helpers");
const TestLib = require("./helpers/testLib");
const Master = artifacts.require("./TellorMaster.sol")
const Tellor = artifacts.require("./TellorTest.sol")
const Extension = artifacts.require("./Extension.sol")
const ITellor = artifacts.require("./ITellor")
const { stakeAmount } = require("./helpers/constants");
const hash = web3.utils.keccak256;
const BN = web3.utils.BN;

contract("Dispute Tests", function(accounts) {
  let master;
  let env;
  let disputeFee;
  const takeFifteen = async () => {
    await helper.advanceTime(60 * 18);
  };
  const startADispute = async (from, requestId = 1, minerIndex = 2) => {
    let count = await master.getNewValueCountbyRequestId(requestId);
    let timestamp = await master.getTimestampbyRequestIDandIndex(
      requestId,
      count.toNumber() - 1
    );
    await master.beginDispute(requestId, timestamp, minerIndex, { from: from });
    let disputeId = await master.getUintVar(hash("_DISPUTE_COUNT"));
    let disp = await master.getAllDisputeVars(disputeId);
    return {
      fee: disp["8"],
      id: disputeId,
      diputer: disp["5"],
      disputed: disp["4"],
    };
  };

  beforeEach("Setup contract for each test", async function() {
    this.timeout(30000)
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
    for (let index = 1; index < 50; index++) {
      await master.addTip(index, index);
    }
    await master.theLazyCoon(tellorMaster.address, web3.utils.toWei("70000", "ether"));
    env = {
      master: master,
      accounts: accounts
    }
    for (let index = 0; index < 12; index++) {
      await helper.advanceTime(60 * 60 * 16);
      await TestLib.mineBlock(env);      
    }
    await master.addTip(1,55);
    await takeFifteen();
    res = await TestLib.mineBlock(env);
    await takeFifteen();
    res = await TestLib.mineBlock(env);
  });
  it("Test multiple dispute to the same miner", async function() {
    let times = [];
    let blocks = [];
    const reportingMiner = accounts[5];
    const reportedMiner = accounts[1];
    const reportedIndex = 1;
    const requestId = 1;
    for (j = 0; j < 4; j++) {
      await master.addTip(1, 1000);
      await takeFifteen();
      await TestLib.mineBlock(env);
      await takeFifteen();
      let block = await TestLib.mineBlock(env);
      let count = await master.getNewValueCountbyRequestId(requestId);
      let timestamp = await master.getTimestampbyRequestIDandIndex(
        requestId,
        count.toNumber() - 1
      );
      blocks.push(block);
      times.push(timestamp);
    }
    let balance1 = await master.balanceOf(reportingMiner);
    let dispBal1 = await master.balanceOf(reportedMiner);
    let orig_dispBal4 = await master.balanceOf(accounts[4]);

    await master.beginDispute(requestId, times[0], reportedIndex, {
      from: reportingMiner,
    });
    await master.beginDispute(requestId, times[1], reportedIndex, {
      from: reportingMiner,
    });
    await master.beginDispute(requestId, times[2], reportedIndex, {
      from: reportingMiner,
    });
    assert(await master.isInDispute(requestId,times[0], "id shoudl be inDispute"))
    //dispute votes and tally
    await helper.expectThrow(master.vote(10, true, { from: accounts[3] }))//try voting on nonexistent id
    await master.vote(1, true, { from: accounts[3] });
    await helper.expectThrow(master.vote(1, true, { from: accounts[3] }))//he already voted
    await master.vote(2, true, { from: accounts[3] });
    await master.vote(3, true, { from: accounts[3] });
    await helper.advanceTime(86400 * 22);
    await master.tallyVotes(1);
    await helper.expectThrow(master.vote(1, true, { from: accounts[4] }))
    await master.tallyVotes(2);
    await master.tallyVotes(3);
    await helper.advanceTime(86400 * 2);
    await helper.expectThrow(master.updateTellor(1))//try running update Tellor on nonexistent function
    await master.unlockDisputeFee(1, { from: accounts[0] });
    await master.unlockDisputeFee(2, { from: accounts[0] });
    await master.unlockDisputeFee(3, { from: accounts[0] });

    dispInfo = await master.getAllDisputeVars(1);
    assert(dispInfo[7][0] == requestId);
    assert(dispInfo[7][2] == blocks[0].values[reportedIndex][0]);
    assert(dispInfo[2] == true, "Dispute Vote passed");

    voted = await master.didVote(1, accounts[3]);
    assert(voted == true, "account 3 voted");
    voted = await master.didVote(1, accounts[5]);
    assert(voted == false, "account 5 did not vote");
    let value = await master.retrieveData(1, times[0]);
    assert(value.toNumber() > 0);

    //checks balances after dispute 1
    let balance2 = await master.balanceOf(reportingMiner);
    let dispBal2 = await master.balanceOf(reportedMiner);

    assert(
      balance2.sub(balance1).eq(stakeAmount),
      "reporting miner's balance should change correctly"
    );

    assert(
      dispBal1.sub(dispBal2).eq(stakeAmount),
      "reported party's balance should change correctly"
    );
    s = await master.getStakerInfo(accounts[1]);
    assert(s != 1, " Not staked");
    dispInfo = await master.getAllDisputeVars(3);
    let dispBal4 = await master.balanceOf(accounts[4]);
    assert(dispBal4 - orig_dispBal4 == 0, "a4 shouldn't change'");
  });

  it("Test multiple dispute to official value/miner index 2", async function() {
    let requetsId = 1;

    let times = [];
    let blocks = [];
    for (j = 0; j < 3; j++) {
      await master.addTip(requetsId, 1000);
      await takeFifteen();
      await TestLib.mineBlock(env);
      await takeFifteen();
      let block = await TestLib.mineBlock(env);
      blocks.push(block);
      let count = await master.getNewValueCountbyRequestId(1);
      let timestamp = await master.getTimestampbyRequestIDandIndex(
        1,
        count.toNumber() - 1
      );
      times.push(timestamp);
    }
    let balance1 = await master.balanceOf(accounts[2]);
    orig_dispBal4 = await master.balanceOf(accounts[4]);
    let dispBal1 = await master.balanceOf(accounts[1]);
    await helper.expectThrow(master.beginDispute(requetsId, times[0], 10, { from: accounts[1] }));//index > 4
    await helper.expectThrow(master.beginDispute(requetsId, times[0]-86420, 2, { from: accounts[1] }));//timestamp not valid
    await master.beginDispute(requetsId, times[0], 2, { from: accounts[1] });
    await helper.expectThrow(master.beginDispute(requetsId, times[0], 2, { from: accounts[1] }));//already started    
    await master.beginDispute(requetsId, times[1], 2, { from: accounts[3] });
    await master.beginDispute(requetsId, times[2], 2, { from: accounts[4] });

    //dispute votes and tally
    await master.vote(1, true, { from: accounts[1] });
    await master.vote(2, true, { from: accounts[1] });
    await master.vote(3, true, { from: accounts[1] });
    await helper.expectThrow(master.depositStake({from:accounts[1]}));//cannot restake if disputed
    await helper.expectThrow(master.unlockDisputeFee(1, { from: accounts[0] }));//not enought time
    await helper.advanceTime(86400 * 22);
    await master.tallyVotes(1);
    await master.tallyVotes(2);
    await master.tallyVotes(3);
    await helper.expectThrow(master.unlockDisputeFee(1, { from: accounts[0] }));//not enought time
    await helper.advanceTime(86400 * 2);
    await helper.expectThrow(master.unlockDisputeFee(10, { from: accounts[0] }));//dispute doesn't exist
    await master.unlockDisputeFee(1, { from: accounts[0] });
    await helper.expectThrow(master.unlockDisputeFee(1, { from: accounts[0] }));//already paid out
    await master.unlockDisputeFee(2, { from: accounts[0] });
    await master.unlockDisputeFee(3, { from: accounts[0] });
    await helper.expectThrow(master.beginDispute(requetsId, times[0], 2, { from: accounts[1] }));//cannot do another vote 
    dispInfo = await master.getAllDisputeVars(1);
    assert(dispInfo[7][0] == requetsId);
    assert(dispInfo["7"][2] == blocks[0].submitted[requetsId][2]);
    assert(dispInfo[2] == true, "Dispute Vote passed");
    voted = await master.didVote(1, accounts[1]);
    assert(voted == true, "account 1 voted");
    voted = await master.didVote(1, accounts[3]);
    assert(voted == false, "account 3 did not vote");
    let value = await master.retrieveData(1, times[0]);
    assert(value.toNumber() == 0);
    //checks balances after dispute 1
    balance2 = await master.balanceOf(accounts[2]);
    dispBal2 = await master.balanceOf(accounts[1]);

    assert(
      balance1.sub(balance2).eq(stakeAmount),
      "reported miner's balance should change correctly"
    );
    assert(
      dispBal2.sub(dispBal1).eq(stakeAmount),
      "disputing party's balance should change correctly"
    );
    s = await master.getStakerInfo(accounts[2]);
    assert(s != 1, " Not staked");
    dispBal4 = await master.balanceOf(accounts[4]);
    assert(dispBal4 - orig_dispBal4 == 0, "a4 shouldn't change'");
    await helper.expectThrow(master.beginDispute(requetsId, times[0], 3, { from: accounts[1] }));//dispute must start within a week
  });
  it("Test multiple dispute rounds, assure increasing per dispute round", async function() {
    await master.theLazyCoon(accounts[1], web3.utils.toWei("500", "ether"));
    await takeFifteen();
    let res = await TestLib.mineBlock(env);
    await master.theLazyCoon(accounts[1], web3.utils.toWei("5000", "ether"));
    let balance1 = await master.balanceOf(accounts[2]);
    let dispBal1 = await master.balanceOf(accounts[1]);
    await startADispute(accounts[1]);
    count = await master.getUintVar(web3.utils.keccak256("_DISPUTE_COUNT"));
    await master.vote(1, true, { from: accounts[3] });
    await helper.expectThrow(master.tallyVotes(1)); //try to tally too early
    await helper.advanceTime(86400 * 3);
    await master.tallyVotes(1);
    await helper.expectThrow(master.tallyVotes(1)); //try to reexecute
    await helper.expectThrow(master.tallyVotes(2)); //try to execute a non-existent vote
    await helper.expectThrow(master.unlockDisputeFee(1, { from: accounts[0] })); //try to withdraw
    dispInfo = await master.getAllDisputeVars(1);
    assert(
      dispInfo[4] == accounts[2],
      "account 2 should be the disputed miner"
    );
    assert(dispInfo[2] == true, "Dispute Vote passed");
    assert(web3.utils.fromWei(dispInfo[7][8]) == 500, "fee should be correct");
    //vote 2 - fails
    await master.theLazyCoon(accounts[6], web3.utils.toWei("5000", "ether"));
    await startADispute(accounts[1]);
    count = await master.getUintVar(web3.utils.keccak256("_DISPUTE_COUNT"));
    await master.vote(2, true, { from: accounts[4] });
    await master.vote(2, true, { from: accounts[6] });
    await helper.advanceTime(86400 * 5);
    await master.tallyVotes(2);
    dispInfo = await master.getAllDisputeVars(2);
    assert(dispInfo[2] == true, "Dispute Vote passes again");
    assert(web3.utils.fromWei(dispInfo[7][8]) == 1000, "fee should be correct");
    await helper.advanceTime(86400 * 2);
    dispInfo = await master.getAllDisputeVars(1);
    assert(dispInfo[2] == true, "Dispute Vote passed");
    await master.unlockDisputeFee(1, { from: accounts[0] });

    dispInfo = await master.getAllDisputeVars(1);
    assert(dispInfo[2] == true, "Dispute Vote passed");
    let balance2 = await master.balanceOf(accounts[2]);
    let dispBal2 = await master.balanceOf(accounts[1]);
    assert(
      balance1 - balance2 == web3.utils.toWei("500"),
      "reported miner's balance should change correctly"
    );
    assert(
      dispBal2 - dispBal1 == web3.utils.toWei("500"),
      "disputing party's balance should change correctly"
    );
  });
  it("Test multiple dispute rounds, assure increasing per dispute round (nonZero)", async function() {
    await master.theLazyCoon(accounts[1], web3.utils.toWei("500", "ether"));
    await takeFifteen();
    res = await TestLib.mineBlock(env);
    await master.theLazyCoon(accounts[1], web3.utils.toWei("5000", "ether"));
    let balance1 = await master.balanceOf(accounts[3]);
    let dispBal1 = await master.balanceOf(accounts[1]);
    await startADispute(accounts[1], 1, 3);
    count = await master.getUintVar(web3.utils.keccak256("_DISPUTE_COUNT"));
    //vote 1 passes
    await master.vote(1, true, { from: accounts[2] });
    await helper.advanceTime(86400 * 3);
    await master.tallyVotes(1);
    await helper.expectThrow(master.unlockDisputeFee(1, { from: accounts[0] })); //try to withdraw
    dispInfo = await master.getAllDisputeVars(1);
    assert(
      dispInfo[4] == accounts[3],
      "account 2 should be the disputed miner"
    );
    assert(dispInfo[2] == true, "Dispute Vote passed");
    assert(web3.utils.fromWei(dispInfo[7][8]) == 400, "fee should be correct");
    //vote 2 - fails
    await master.theLazyCoon(accounts[6], web3.utils.toWei("5000", "ether"));
    await startADispute(accounts[0], 1, 3);
    count = await master.getUintVar(web3.utils.keccak256("_DISPUTE_COUNT"));
    await master.vote(2, true, { from: accounts[6] });
    await master.vote(2, true, { from: accounts[4] });
    await helper.advanceTime(86400 * 5);
    await master.tallyVotes(2);

    dispInfo = await master.getAllDisputeVars(2);
    assert(dispInfo[2] == true, "Dispute Vote passes again");
    assert(
      web3.utils.fromWei(dispInfo[7][8]) == 400 * 2,
      "fee should be correct"
    );
    await helper.advanceTime(86400 * 2);
    dispInfo = await master.getAllDisputeVars(1);
    assert(dispInfo[2] == true, "Dispute Vote passed");
    await master.unlockDisputeFee(1, { from: accounts[0] });

    dispInfo = await master.getAllDisputeVars(1);
    assert(dispInfo[2] == true, "Dispute Vote passed");
    let balance2 = await master.balanceOf(accounts[3]);
    let dispBal2 = await master.balanceOf(accounts[1]);

    assert(
      balance1 - balance2 == web3.utils.toWei("500"),
      "reported miner's balance should change correctly"
    );
    assert.equal(
      dispBal2.sub(dispBal1).toString(),
      web3.utils.toWei("500"),
      "disputing party's balance should change correctly"
    );
  });
});
