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

contract("More Dispute Tests", function(accounts) {
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
    for (var i = 0; i < 7; i++) {
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
    let disp = await startADispute(accounts[1]);
    disputeId = disp.id;
    diputer = disp.disputer;
    disputed = disp.disputed;
    disputeFee = await master.getUintVar(hash("_DISPUTE_FEE"));

  })
    it("Test basic dispute", async function() {
      // console.log("basic disp 1")
      balance1 = await master.balanceOf(accounts[2]);
      dispBal1 = await master.balanceOf(accounts[1]);
      count = await master.getUintVar(web3.utils.keccak256("_DISPUTE_COUNT"));
      await master.vote(1, true, { from: accounts[3] });
      await helper.advanceTime(86400 * 22);   
      await master.tallyVotes(1);
      await helper.advanceTime(86400 * 2);
      await master.unlockDisputeFee(1);
      dispInfo = await master.getAllDisputeVars(1);
      assert(dispInfo[7][0] == 1, "request id should be right");
      assert(dispInfo[7][2] == 3300, "value submited should be right");
      assert(dispInfo[2] == true, "Dispute Vote passed");
      voted = await master.didVote(1, accounts[3]);
      assert(voted == true, "account 3 voted");
      voted = await master.didVote(1, accounts[5]);
      assert(voted == false, "account 5 did not vote");
      balance2 = await master.balanceOf(accounts[2]);
      dispBal2 = await master.balanceOf(accounts[1]);
      assert(
        web3.utils.fromWei(balance1) - web3.utils.fromWei(balance2) == 500,
        "reported miner's balance should change correctly"
      );
      assert(
        web3.utils.fromWei(dispBal2) -
          web3.utils.fromWei(dispBal1) ==
          1000,
        "disputing party's balance should change correctly (ncludes dispute fee + stake)"
      );
      s = await master.getStakerInfo(accounts[2]);
      assert(s != 1, " Not staked");
    });

    it("Test multiple dispute rounds, passing all three", async function() {
      let balance1 = await master.balanceOf(accounts[2]);
      let dispBal1 = await master.balanceOf(accounts[1]);
      let count = await master.getUintVar(hash("_DISPUTE_COUNT"));
      //vote 1 passes
      await master.vote(disputeId, true);
      await helper.advanceTime(86400 * 3);
      await master.tallyVotes(disputeId);

      await helper.expectThrow(
        master.unlockDisputeFee(disputeId, { from: accounts[0] })
      );
      //try to withdraw
      dispInfo = await master.getAllDisputeVars(disputeId);
      assert(
        dispInfo[4] == accounts[2],
        "account 2 should be the disputed miner"
      );
      assert(dispInfo[2] == true, "Dispute Vote passed");
      //vote 2 - passes
      await master.theLazyCoon(accounts[6], web3.utils.toWei("5000", "ether"));
      let disp2 = await startADispute(accounts[6]);
      count = await master.getUintVar(hash("_DISPUTE_COUNT"));
      await master.vote(disp2.id, true, { from: accounts[6] });
      await master.vote(disp2.id, true, { from: accounts[4] });
      await helper.advanceTime(86400 * 5);
      await master.tallyVotes(disp2.id);
      dispInfo = await master.getAllDisputeVars(2);
      assert(dispInfo[2] == true, "Dispute Vote passes again");
      // vote 3 - passes
      await master.theLazyCoon(accounts[3], web3.utils.toWei("5000", "ether"));
      let disp3 = await startADispute(accounts[3]);
      count = await master.getUintVar(hash("_DISPUTE_COUNT"));
      assert(count == 3);
      await master.vote(disp3.id, false, { from: accounts[6] });
      await master.vote(disp3.id, true, { from: accounts[3] });
      await master.vote(disp3.id, true, { from: accounts[4] });
      await helper.expectThrow(master.vote(1, true, { from: accounts[7] }))
      await helper.advanceTime(86400 * 9);
      await master.tallyVotes(disp3.id);
      await helper.advanceTime(86400 * 2);
      dispInfo = await master.getAllDisputeVars(3);
      assert(dispInfo[2] == true, "Dispute Vote passed");
      await master.unlockDisputeFee(1, { from: accounts[0] });
      dispInfo = await master.getAllDisputeVars(1);
      assert(dispInfo[2] == true, "Dispute Vote passed");
      let balance2 = await master.balanceOf(accounts[2]);
      let dispBal2 = await master.balanceOf(accounts[1]);
      let disputeFee = await master.getUintVar(hash("_DISPUTE_FEE"));

      assert(
        balance1.sub(balance2).toString() == web3.utils.toWei("500"),
        "reported miner's balance should change correctly"
      );
      assert(
        dispBal2.sub(dispBal1).toString() == web3.utils.toWei("1000"),
        "disputing party's balance should change correctly"
      );
    });

    it("Test multiple dispute rounds - passing, then failing", async function() {
      balance1 = await master.balanceOf(accounts[2]);
      dispBal1 = await master.balanceOf(accounts[1]);
      count = await master.getUintVar(hash("_DISPUTE_COUNT"));
      await master.vote(1, { from: accounts[3] });

      await helper.advanceTime(86400 * 3);
      await master.tallyVotes(disputeId);

      await helper.expectThrow(
        master.unlockDisputeFee(1, { from: accounts[0] })
      ); //try to withdraw
      dispInfo = await master.getAllDisputeVars(1);
      assert(
        dispInfo[4] == accounts[2],
        "account 2 should be the disputed miner"
      );
      assert(dispInfo[2] == true, "Dispute Vote passed");
      let disp2 = await startADispute(accounts[1]);
      count = await master.getUintVar(hash("_DISPUTE_COUNT"));
      await master.vote(disp2.id, false, { from: accounts[6] });
      await master.vote(disp2.id, false, { from: accounts[4] });
      await helper.advanceTime(86400 * 5);

      await master.tallyVotes(disp2.id);
      dispInfo = await master.getAllDisputeVars(2);
      assert(dispInfo[2] == false, "Dispute Vote failed");
      await helper.advanceTime(86400 * 2);

      await master.unlockDisputeFee(1, { from: accounts[6] });

      dispInfo = await master.getAllDisputeVars(1);
      assert(dispInfo[2] == true, "Dispute Vote passed");
      dispInfo2 = await master.getAllDisputeVars(2);
      balance2 = await master.balanceOf(accounts[2]);
      dispBal2 = await master.balanceOf(accounts[1]);
      let disputeFee = await master.getUintVar(hash("_DISPUTE_FEE"));
      let stakeAmount = await master.getUintVar(hash("_stakeAmount"));
      assert(
        dispBal1
          .sub(dispBal2)
          .eq(dispInfo2[7][8]),
        "disputing party's balance should change correctly"
      );
    });

    it("Test multiple dispute rounds - failing, then passing", async function() {
      balance1 = await master.balanceOf(accounts[2]);
      dispBal1 = await master.balanceOf(accounts[1]);
      count = await master.getUintVar(web3.utils.keccak256("_DISPUTE_COUNT"));
      //vote 1 fails
      await master.vote(1, false);
      await helper.advanceTime(86400 * 3);
      await master.tallyVotes(1);
      await helper.expectThrow(master.unlockDisputeFee(1)); //try to withdraw
      dispInfo = await master.getAllDisputeVars(1);
      assert(
        dispInfo[4] == accounts[2],
        "account 2 should be the disputed miner"
      );
      assert(dispInfo[2] == false, "Dispute Vote failed");
      //vote 2 - passes
      let disp2 = await startADispute(accounts[1]);
      count = await master.getUintVar(web3.utils.keccak256("_DISPUTE_COUNT"));
      await master.vote(disp2.id, true, { from: accounts[6] });
      await master.vote(disp2.id, true, { from: accounts[4] });
      await helper.advanceTime(86400 * 5);
      await master.tallyVotes(disp2.id);
      dispInfo = await master.getAllDisputeVars(2);
      assert(dispInfo[2] == true, "Dispute Vote passed");
      await helper.advanceTime(86400 * 2);
      await master.unlockDisputeFee(1);
      balance2 = await master.balanceOf(accounts[2]);
      dispBal2 = await master.balanceOf(accounts[1]);
      let disputeFee = await master.getUintVar(hash("_DISPUTE_FEE"));

      assert(
        balance1 - balance2 ==
          (await master.getUintVar(web3.utils.keccak256("_STAKE_AMOUNT"))),
        "reported miner's balance should change correctly"
      );
      assert(
        web3.utils.fromWei(dispBal2) - web3.utils.fromWei(dispBal1) == 1000,
        "disputing party's balance should change correctly"
      );
      assert(
        web3.utils.fromWei(balance1) - web3.utils.fromWei(balance2) == 500,
        "Account 2 balance should be correct"
      );
    });
});
