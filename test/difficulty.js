const { timeTarget } = require("./helpers/constants");
const { artifacts } = require("hardhat");
const helper = require("./helpers/test_helpers");
const TestLib = require("./helpers/testLib");
const Master = artifacts.require("./TellorMaster.sol")
const Tellor = artifacts.require("./TellorTest.sol")
const Getters = artifacts.require("./TellorGetters.sol")
const ITellor = artifacts.require("./ITellor")
const BN = web3.utils.BN;


contract("Difficulty tests", function(accounts) {
    let tellorMaster = {};
  let tellor = {};
  let env = {};

  let master = {}

  const getDiff = async () => {
    let diff = await master.getNewCurrentVariables();
    return diff[2].toNumber();
  };

  beforeEach("Setup contract for each test", async function() {
      //Could use the getV25(accounts, true), since you're upgrading in the first line of tests. I added full tips to getV25 in testLib already
    tellor = await Tellor.new()
    oldTellor = await Tellor.new()
    tellorMaster = await Master.new(tellor.address, oldTellor.address)

    await tellorMaster.changeTellorContract(tellor.address)

    let getter = await Getters.new()
master = await ITellor.at(tellorMaster.address)
    await master.changeTellorGetters(getter.address)
    

    env = {
      master: master,
      accounts: accounts
    }
    await master.theLazyCoon(tellorMaster.address, web3.utils.toWei("70000", "ether"));

    await TestLib.depositStake(env)
  });

  it("Test Difficulty Adjustment", async function() {
    await helper.advanceTime(60 * 60 * 16);
    await master.manuallySetDifficulty(100000000000);
    await TestLib.mineBlock(env);

    let diff1 = await master.getNewCurrentVariables();
    assert(diff1[2] > 1, "difficulty greater than 1"); //difficulty not changing.....
    let vars = await master.getNewCurrentVariables();
    await helper.advanceTime(60 * 60 * 16);
    await TestLib.mineBlock(env);
    vars = await master.getNewCurrentVariables();
    assert(vars[2] < diff1[2], "difficulty should continue to move down");
  });

  it("Test time travel in data -- really long time since last Poof and proper difficulty adjustment", async function() {
    await helper.advanceTime(60 * 60 * 16);
    await TestLib.mineBlock(env);
    await master.manuallySetDifficulty(1000);
    vars = await master.getNewCurrentVariables();
    var oldDiff = vars[2];
    assert(vars[2] > 1, "difficulty should be greater than 1"); //difficulty not changing.....
    await helper.advanceTime(86400 * 20);
    await TestLib.mineBlock(env);
    vars = await master.getNewCurrentVariables();
    var newDiff = vars[2];
    assert(newDiff * 1 + 0 < oldDiff * 1 + 0, "difficulty should be lower");
  });

  it("Test lower difficulty target (4 min)", async function() {
    assert(
      (await master.getUintVar(web3.utils.keccak256("_TIME_TARGET"))) ==
        timeTarget
    ),
      "difficulty should be 240";
  });

  describe("Difficulty on 4th slot", async () => {
    beforeEach(async () => {
      //Stake accounts 20...40
      for (var i = 20; i < accounts.length; i++) {
        await master.theLazyCoon(
          accounts[i],
          web3.utils.toWei("7000", "ether")
        );
        let info = await env.master.getStakerInfo(accounts[i]);
        if (info["0"].toString() != "1") {
          await env.master.depositStake({ from: accounts[i] });
        }
      }
    });

    it("Difficulty decrease based on the 4th slot", async () => {
      await helper.takeFifteen();
      await TestLib.mineBlock(env);
      await master.manuallySetDifficulty(1000);
      let currentDiff = await getDiff();

      await helper.takeFifteen();

      // Mine 4 slots:
      let vars = await env.master.getNewCurrentVariables();
      const values = [1000, 1000, 1000, 1000, 1000];
      for (var i = 0; i < 4; i++) {
        res = await master.testSubmitMiningSolution(
          "nonce",
          vars["1"],
          values,
          {
            from: accounts[i + 25],
          }
        );
      }

      let afterDiff = await getDiff();
      assert(currentDiff > afterDiff, "Difficulty should have decreased");
    });

    it("Difficulty increase based on the 4th slot", async () => {
      await helper.takeFifteen();
      await TestLib.mineBlock(env);
      await master.manuallySetDifficulty(1000);
      let currentDiff = await getDiff();

      //move only 1 minute
      await helper.advanceTime(60);

      // Mine 4 slots:
      let vars = await env.master.getNewCurrentVariables();
      const values = [1000, 1000, 1000, 1000, 1000];
      for (var i = 0; i < 4; i++) {
        res = await master.testSubmitMiningSolution(
          "nonce",
          vars["1"],
          values,
          {
            from: accounts[i + 25],
          }
        );
      }

      let afterDiff = await getDiff();
      assert(currentDiff < afterDiff, "Difficulty should have increase");
    });

    it("Zero difficulty on the 5th slot", async () => {
      await TestLib.mineBlock({
        master: master,
        accounts: accounts.slice(30, 35),
      });
      await master.manuallySetDifficulty(1000);
      await helper.advanceTime(61);
      let vars = await env.master.getNewCurrentVariables();
      const values = [1000, 1000, 1000, 1000, 1000];
      //Try mine first slot with incorrect nonce
      await helper.expectThrow(
        master.submitMiningSolution("nonce", vars["1"], values, {
          from: accounts[39],
        })
      );
      // Mine 4 slots bypassing the nonce:
      for (var i = 0; i < 4; i++) {
        res = await master.testSubmitMiningSolution(
          "nonceer",
          vars["1"],
          values,
          {
            from: accounts[i + 25],
          }
        );
      }
      //Mine the 5th with any nonce
      await master.submitMiningSolution("nonce", vars["1"], values, {
        from: accounts[39],
      });
      let requestId = vars["1"][0];
      let count = await master.getNewValueCountbyRequestId(requestId);
      let timestamp = await master.getTimestampbyRequestIDandIndex(
        requestId,
        count.toNumber() - 1
      );
      let miners = await master.getMinersByRequestIdAndTimestamp(
        requestId,
        timestamp
      );
      assert(miners.indexOf(accounts[39]) != -1, "miner should have mined");
    });
  });
});
