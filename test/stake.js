const { artifacts } = require("hardhat");
const helper = require("./helpers/test_helpers");
const Master = artifacts.require("./TellorMaster.sol")
const Tellor = artifacts.require("./TellorTest.sol")
const Extension = artifacts.require("./Extension.sol")
const ITellor = artifacts.require("./ITellor")

contract("Staking Tests", function(accounts) {
  let tellorMaster = {};
  let tellor = {};
  let env = {};

  let master = {}

  beforeEach("Setup contract for each test", async function() {
    let extension = await Extension.new()
    tellor = await Tellor.new(extension.address)
    oldTellor = await Tellor.new(extension.address)
    tellorMaster = await Master.new(tellor.address, oldTellor.address)
    master = await ITellor.at(tellorMaster.address)
    for (var i = 0; i < accounts.length; i++) {
      await master.theLazyCoon(accounts[i], web3.utils.toWei("7000", "ether"));
    }
    for (let index = 1; index < 50; index++) {
      await master.addTip(index, index);
    }
    await master.theLazyCoon(tellorMaster.address, web3.utils.toWei("70000", "ether"));
    env = {
      master: master,
      accounts: accounts
    }
  });
  it("Stake miner", async function() {
    await master.theLazyCoon(accounts[6], web3.utils.toWei("5000", "ether"))
    await master.transfer(accounts[7],await master.balanceOf(accounts[8]),{from:accounts[8]})
    await helper.expectThrow(master.depositStake({from:accounts[8]}));//not enough balance
    await master.depositStake({from:accounts[6]})
    let s = await master.getStakerInfo(accounts[6]);
    assert(s[0] == 1, "Staked");
  });
  it("getStakersCount", async function() {
    await master.depositStake({from:accounts[7]})
    let count = await master.getUintVar(web3.utils.keccak256("_STAKE_COUNT"));
    assert(web3.utils.hexToNumberString(count) == 1, "count is 1"); //added miner
  });
  it("test updateMinDisputeFee", async function() {
    let origDisputeFee = await master.getUintVar(web3.utils.keccak256("_DISPUTE_FEE"));
    assert(origDisputeFee - web3.utils.toWei("500") == 0, "original dispute fee should be correct");
    await master.updateMinDisputeFee();
    origDisputeFee = await master.getUintVar(web3.utils.keccak256("_DISPUTE_FEE"));
    assert(origDisputeFee*1 - web3.utils.toWei("500") == 0, "original dispute fee should be correct");
    await master.depositStake({from:accounts[7]})
    await master.depositStake({from:accounts[6]})
    await master.depositStake({from:accounts[8]})
    origDisputeFee = await master.getUintVar(web3.utils.keccak256("_DISPUTE_FEE"));   
    assert(origDisputeFee - web3.utils.toWei("492.5") == 0, "original dispute fee should be correct");
  });
  it("getStakersInfo", async function() {
    await master.depositStake({from:accounts[1]})
    let info = await master.getStakerInfo(accounts[1]);
    let stake = web3.utils.hexToNumberString(info["0"]);
    let startDate = web3.utils.hexToNumberString(info["1"]);
    // console.log(startDate*1, "startDate")
    let _date = new Date();
    let d = (_date - (_date % 86400000)) / 1000;
    // console.log(d*1)
    assert(startDate >= d * 1, "startDate is today");
    assert(stake * 1 == 1, "Should be 1 for staked address");
  });

  it("Staking, requestStakingWithdraw, withdraw stake", async function() {
    await master.depositStake({from: accounts[1]})
    let withdrawreq = await master.requestStakingWithdraw({
      from: accounts[1],
    });
    await helper.advanceTime(86400 * 8);
    s = await master.getStakerInfo(accounts[1]);
    assert(s['0'] *1-0 == 2, " Should be 2");
    await master.withdrawStake({ from: accounts[1] });
    s = await master.getStakerInfo(accounts[1]);
    assert(s['0'] *1-0 == 0, "not Staked");
  });
  it("Attempt to Allow and transferFrom more than balance - stake", async function() {
    await master.theLazyCoon(accounts[2], web3.utils.toWei("5000", "ether"));
    await master.transfer(accounts[8], web3.utils.toWei("500"), {
      from: accounts[1],
    });
    var tokens = web3.utils.toWei("2", "ether");
    var tokens2 = web3.utils.toWei("530", "ether");
    await master.transfer(accounts[1], tokens, { from: accounts[2] });
    balance1 = await master.balanceOf(accounts[1]);
    await master.approve(accounts[6], tokens2, { from: accounts[1] });
    await helper.expectThrow(
      master.transferFrom(accounts[1], accounts[8], "1" + tokens2.toString(), {
        from: accounts[6],
      })
    );
    balance1b = await master.balanceOf(accounts[1]);
    assert(
      web3.utils.fromWei(balance1b) * 1 == web3.utils.fromWei(balance1) * 1,
      "Balance for acct 1 should not change "
    );
  });
  it("Attempt to withdraw unnaproved", async function() {
    await master.depositStake({from:accounts[1]})
    balance1 = await master.balanceOf(accounts[1])
    await helper.expectThrow(
       master.withdrawStake({from:accounts[1]})//miner not locked
    );
    s = await master.getStakerInfo(accounts[1]);
    assert(s[0] == 1, " Staked");
    balance1b = await master.balanceOf(accounts[1])
    assert(
      web3.utils.fromWei(balance1b) *1 == web3.utils.fromWei(balance1) * 1,
      "Balance for acct 1 should not change "
    );
  });
  it("Attempt to transfer more than balance - stake", async function() {
    await master.theLazyCoon(accounts[2], web3.utils.toWei("5000", "ether"))
    var tokens = web3.utils.toWei("1", "ether");
    var tokens2 = web3.utils.toWei("2000000", "ether");
    await master.transfer(accounts[1], tokens,{from:accounts[2]})
    balance1 = await master.balanceOf(accounts[1])
    await helper.expectThrow(
      master.transfer(accounts[2], tokens2,{from:accounts[1]})
    );
    balance1b = await master.balanceOf(accounts[1])
    assert(
      web3.utils.fromWei(balance1b) *1 == web3.utils.fromWei(balance1) * 1,
      "Balance for acct 1 should not change "
    );
  });
  it("re-Staking without withdraw ", async function() {
        await master.depositStake({from:accounts[1]})

    await helper.advanceTime(86400 * 10);
    let withdrawreq = await master.requestStakingWithdraw({
      from: accounts[1],
    });
    await helper.advanceTime(86400 * 10);
    let s = await master.getStakerInfo(accounts[1]);
    assert(s[0] == 2, "is not Staked");
    await master.depositStake({ from: accounts[1] });
    s = await master.getStakerInfo(accounts[1]);
    assert(s[0] == 1, "is not Staked");
  });
  it("withdraw and re-stake", async function() {
        await master.depositStake({from:accounts[1]})

    await helper.advanceTime(86400 * 10);
    await helper.expectThrow(master.requestStakingWithdraw({from: accounts[2]}));
    let withdrawreq = await master.requestStakingWithdraw({
      from: accounts[1],
    });
    await helper.expectThrow(
      master.withdrawStake({from:accounts[1]})//not enough time has passed
    );
    await helper.advanceTime(86400 * 10);
    let s = await master.getStakerInfo(accounts[1]);
    assert(s[0] == 2, "is not Staked");
    await master.withdrawStake({ from: accounts[1] });
    s = await master.getStakerInfo(accounts[1]);
    assert(s[0]  == 0, " not Staked");
    await master.depositStake({ from: accounts[1] });
    s = await master.getStakerInfo(accounts[1]);
    assert(s[0] == 1, " Staked");
  });
});
