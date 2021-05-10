const { artifacts } = require("hardhat");
const Master = artifacts.require("./TellorMaster.sol")
const Tellor = artifacts.require("./TellorTest.sol")
const ITellor = artifacts.require("./ITellor.sol")
const UtilitiesTests = artifacts.require("./UtilitiesTest")
const Extension = artifacts.require("./Extension.sol")
const helper = require("./helpers/test_helpers");
const BN = web3.utils.BN;

contract("Request and tip tests", function(accounts) {
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
    }

    for (let index = 1; index < 58; index++) {
      await master.addTip(index, 1);
    }
  });
  it("Failing non-staked mine ", async function() {
    let currrVars = await master.getNewCurrentVariables();
    let reqs = currrVars["1"];
    await helper.expectThrow(master.testSubmitMiningSolution("nonce",reqs,[1,1,1,1,1],{from:accounts[1]}));
  });
  it("Add Tip", async function() {
    await helper.expectThrow(master.addTip(0,10)); //try to tip 0 id
    await helper.expectThrow(master.addTip(11,0)); //try to tip 0
    await helper.expectThrow(master.addTip(250,10)); //try to really high id
    let vars = await master.getRequestVars(11);
    let initialTip = vars[1];
    apiVars = await master.getRequestVars(11);
    res = await master.addTip(11, 20);
    apiVars = await master.getRequestVars(11);
    assert(
      apiVars[1].toNumber() == initialTip.toNumber() + 20,
      "value pool should be 20"
    );
  });
it("several request data", async function() {
    let req1 = await master.addTip(41, 500, { from: accounts[2] });
    req1 = await master.addTip(42, 500, { from: accounts[2] });
    req1 = await master.addTip(43, 500, { from: accounts[2] });
    req1 = await master.addTip(44, 500, { from: accounts[2] });
    req1 = await master.addTip(31, 400, { from: accounts[2] });
    data = await master.getNewVariablesOnDeck();
    let ids = data["0"].map((i) => i.toString());
    let tips = data["1"].map((i) => i.toString());
    assert(ids.includes("41"), "ID on deck should be 41");
    assert(ids.includes("31"), "ID on deck should be 31");
    assert(tips.includes("401"), "Tip should include 401");
    req1 = await master.addTip(32, 410, { from: accounts[2] });
    data = await master.getNewVariablesOnDeck();
    ids = data["0"].map((i) => i.toString());
    tips = data["1"].map((i) => i.toString());
    assert(ids.includes("42"), "ID on deck should be 41");
    assert(ids.includes("32"), "ID on deck should be 32");
    assert(tips.includes("411"), "Tip should be 411");
    await master.addTip(33, 550, { from: accounts[2] });
    data = await master.getNewVariablesOnDeck();
    ids = data["0"].map((i) => i.toString());
    tips = data["1"].map((i) => i.toString());
    assert(ids.includes("43"), "ID on deck should be 43");
    assert(ids.includes("33"), "ID on deck should be 33");
    assert(tips.includes("551"), "Tip should be 551");
    req1 = await master.addTip(34, 660, { from: accounts[2] });
    data = await master.getNewVariablesOnDeck();
    ids = data["0"].map((i) => i.toString());
    tips = data["1"].map((i) => i.toString());
    assert(ids.includes("43"), "ID on deck should be 43");
    assert(ids.includes("34"), "ID on deck should be 34");
    assert(tips.includes("661"), "Tip should be 601");
  });
  it("Request data and change on queue with another request", async function() {
    // were the outputs for getRequestVars changed from 5 items to 2 ? will this affect other stuff?
    let vars31 = await master.getRequestVars(31);
    let vars32 = await master.getRequestVars(32);
    let tipBefore31 = vars31[1];
    // console.log("tipBefore31", tipBefore31)
    let tipBefore32 = vars32[1];
    // console.log("tipBefore32", tipBefore32)
    balance1 = await master.balanceOf(accounts[2], { from: accounts[1] });
    let pay = new BN(web3.utils.toWei("20", "ether"));
    let pay2 = new BN(web3.utils.toWei("50", "ether"));
    let res3 = await master.addTip(31, pay, { from: accounts[2] });
    apiVars = await master.getRequestVars(31);
    // console.log(apiVars[1] * 1)
    // console.log("tipBefore31", tipBefore31)
    assert(apiVars[1].eq(pay.add(tipBefore31)), "value pool should be 20");
    data = await master.getNewVariablesOnDeck();
    ids = data["0"].map((i) => i.toString());
    assert(ids.includes("31"), "ID on deck should be 31");
    res3 = await master.addTip(32, pay2, { from: accounts[2] });
    data = await master.getNewVariablesOnDeck();
    ids = data["0"].map((i) => i.toString());
    tips = data["1"].map((i) => i.toString());
    assert(ids.includes("31"), "ID on deck should be 31");
    assert(ids.includes("32"), "ID on deck should be 31");
    assert(
      tips.includes(pay.add(tipBefore31).toString()),
      "Tipdson deck should be 31"
    );
    assert(
      tips.includes(pay2.add(tipBefore32).toString()),
      "Tipds on deck should be 31"
    );
    balance2 = await master.balanceOf(accounts[2], { from: accounts[1] });
    assert(
      web3.utils.fromWei(balance1) - web3.utils.fromWei(balance2) == 70,
      "balance should be down by 70"
    );
  });
  it("Test 51 request and lowest is kicked out", async function() {
    let previousTips = [];
    for (var i = 0; i <= 56; i++) {
      let tip = await master.getRequestVars(i);
      previousTips.push(tip[1]);
    }

    await master.theLazyCoon(accounts[2], web3.utils.toWei("1000", "ether"));
    for (var i = 1; i <= 56; i++) {
      await master.addTip(i, i, {
        from: accounts[2],
      });
    }

    let payoutPool = await master.getRequestQ();
    for (var i = 11; i <= 36; i++) {
      assert(
        payoutPool[i].toNumber() == previousTips[i].toNumber() + i,
        "should be equal"
      );
    }
    apiVars = await master.getRequestVars(47);
    apiIdforpayoutPoolIndex = await master.getRequestIdByRequestQIndex(50);
    vars = await master.getNewVariablesOnDeck();
    let apiOnQ = vars[0];
    let apiPayout = vars[1];
    for (var i = 0; i <= 4; i++) {
      apiPayout[i] = apiPayout[i] * 1 - 0;
      apiOnQ[i] = apiOnQ[i] * 1 - 0;
    }

    // console.log(apiIdforpayoutPoolIndex.toString());

    assert(
      apiIdforpayoutPoolIndex.toString() == "50",
      "position 1 should be booted"
    );
    assert(apiPayout.includes(56), "API on Q payout should be 56");
    assert(apiOnQ.includes(56), "API on Q should be 56");
    // console.log(apiVars);
    assert(apiVars[0].toNumber() == 47, "position 1 should have correct value");
  });

  it("Test Throw on wrong apiId", async function() {
    vars = await master.getNewCurrentVariables();
    await helper.expectThrow(
      master.testSubmitMiningSolution(
        "nonce",
        [60, 2, 3, 4, 5],
        [1200, 1300, 1400, 1500, 1600]
      )
    );
  });
});
