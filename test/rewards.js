const { artifacts } = require("hardhat");
const TestLib = require("./helpers/testLib");

const helper = require("./helpers/test_helpers");
const Master = artifacts.require("./TellorMaster.sol")
const Tellor = artifacts.require("./TellorTest.sol")
const Getters = artifacts.require("./TellorGetters.sol")
const ITellor = artifacts.require("./ITellor")
const hash = web3.utils.keccak256;

contract("Reward Tests", function(accounts) {
  let tellorMaster = {};
  let tellor = {};
  let env = {};

  let master = {}

  beforeEach("Setup contract for each test", async function() {
    tellor = await Tellor.new()
    oldTellor = await Tellor.new()
    tellorMaster = await Master.new(tellor.address, oldTellor.address)
    let getter = await Getters.new()
    await tellorMaster.changeTellorGetters(getter.address)
    master = await ITellor.at(tellorMaster.address)

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
  });

  it("Inflation is fixed", async function() {
    await helper.advanceTime(60 * 60 * 16);
    await TestLib.mineBlock(env);
    let rew = await master.getUintVar(web3.utils.keccak256("_CURRENT_REWARD"));
    assert.equal(rew.toString(), "1000000000000000000");
  });

  ////Adjust this test when fixing the smart contracts
  it("Rewards are proportional to time passed", async () => {
    //  zeroing tips
    for (var i = 0; i < 10; i++) {
      await helper.takeFifteen();
      await TestLib.mineBlock(env);
    }

    //Add tip and mine 2 blocks to clear tips
    await master.addTip(10, 1);
    await helper.advanceTime(60 * 16);
    await TestLib.mineBlock(env);
    await helper.advanceTime(60 * 16);
    let tx = await TestLib.mineBlock(env);

    let balBef = await master.balanceOf(accounts[1]);
    // console.log(web3.utils.fromWei(balBef.toString()));
    await helper.advanceTime(60 * 15);
    await TestLib.mineBlock(env);
    let balAfter = await master.balanceOf(accounts[1]);

    //15 min passed, should have 3 TRBs as reward, 1 per each 5 min
    assert(web3.utils.fromWei(balAfter) - web3.utils.fromWei(balBef) >= 3.0);
    assert(web3.utils.fromWei(balAfter) - web3.utils.fromWei(balBef) <= 3.1);
  });

  it("Test allow tip of current mined ID", async function() {
    //Mine a few blocks to get requestQ in order:
    for (let index = 0; index < 12; index++) {
      await helper.advanceTime(60 * 60 * 16);
      await TestLib.mineBlock(env);      
    }
    vars = await master.getNewCurrentVariables();
    await master.addTip(1, 10001);
    await helper.takeFifteen();
    await TestLib.mineBlock(env);
    vars2 = await master.getNewCurrentVariables();
    assert(vars2[3] > 10000, "tip should be big");
  });

  it("Test zeroing out of currentTips", async function() {
    let tip = await master.getUintVar(hash("_CURRENT_TOTAL_TIPS"));
    await master.addTip(1, 100000000000);
    await helper.takeFifteen();
    await TestLib.mineBlock(env);
    await helper.takeFifteen();
    await TestLib.mineBlock(env);
    let tip1 = await master.getRequestUintVars(1, hash("_TOTAL_TIP"));
    assert(tip1.toString() == "0", "tip for request one should be zeroed");
  });

  it("Test Proper zeroing of Payout Test", async function() {
    vars = await master.getNewCurrentVariables();
    for (var i = 0; i < 11; i++) {
      //we need to mine ~10 blocks to clear all tips
      await helper.takeFifteen();
      await TestLib.mineBlock(env);
    }
    vars = await master.getRequestVars(vars["1"][0]);
    assert(vars["1"].toString() == "0", "api payout should be zero");
    vars = await master.getUintVar(web3.utils.keccak256("_CURRENT_TOTAL_TIPS"));
    assert(vars == 0, "api payout should be zero");
  });
});
