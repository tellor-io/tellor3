const TestLib = require("./helpers/testLib");
const helper = require("./helpers/test_helpers");
const Master = artifacts.require("./TellorMaster")
const Tellor = artifacts.require("./TellorTest")
const Extension = artifacts.require("./Extension")
const ITellor = artifacts.require("ITellor")

contract("DidMine test", function(accounts) {
  let tellorMaster = {};
  let tellor = {};
  let env = {};

  let master = {}


  beforeEach("Setup contract for each test", async function() {
    //Could use the getV25(accounts, true), since you're upgrading in the first line of tests. I added full tips to getV25 in testLib already
    tellor = await Tellor.new()
    oldTellor = await Tellor.new()
    tellorMaster = await Master.new(tellor.address, oldTellor.address)
    let extension = await Extension.new()
master = await ITellor.at(tellorMaster.address)
    await master.changeExtension(extension.address)
    env = {
      master: master,
      accounts: accounts
    }
    await master.theLazyCoon(tellorMaster.address, web3.utils.toWei("70000", "ether"));
    await TestLib.depositStake(env)
  });

  it("Test didMine ", async function() {
    await helper.advanceTime(60 * 16);
    //TestLib.mineBlock(env) already fetches the currentVariables. Fetching here to use in the verification
    let v = await master.getNewCurrentVariables();
   await TestLib.mineBlock(env);
    let didMine = await master.didMine(v[0], accounts[2]);
    assert(didMine);
  });

    it("Test can't mine twice ", async function() {
    await helper.advanceTime(60 * 16);
    //TestLib.mineBlock(env) already fetches the currentVariables. Fetching here to use in the verification
    let v = await master.getNewCurrentVariables();
    await master.testSubmitMiningSolution(
        "nonce",
        v["1"],
        ["1000","1000","1000","1000","1000"],
        {
          from: accounts[1],
          value: "0",
        })
       await helper.advanceTime(60 * 16);

       helper.expectThrow(
     master.testSubmitMiningSolution(
        "nonce",
        v["1"],
        ["1000","1000","1000","1000","1000"],
        {
          from: accounts[1],
          value: "0",
        }))
  });
});
