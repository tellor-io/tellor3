const { artifacts } = require("hardhat");
const Master = artifacts.require("./TellorMaster.sol")
const Tellor = artifacts.require("./TellorTest.sol")
const ITellor = artifacts.require("./ITellor")
const Extension = artifacts.require("./Extension.sol")
const UtilitiesTests = artifacts.require("./UtilitiesTest")
const helper = require("./helpers/test_helpers");
const TestLib = require("./helpers/testLib");
const BN = web3.utils.BN;

contract("Utilities Tests", function(accounts) {
  let tellor;
  let tellorMaster;
  let utilities;
  let master;

  const printRequestQ = async () => {
    let q = await master.getRequestQ();
    console.log("Request Q", q.length);
    q.map((i) => console.log(i.toString()));
  };

  beforeEach("Setup contract for each test", async function() {
    this.timeout(40000)
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

    for (let index = 1; index < 58; index++) {
      await master.addTip(index, 1);
    }

    env = {
      master: master,
      accounts: accounts
    }

          await master.theLazyCoon(master.address, web3.utils.toWei("700000", "ether"));

       //Mining 11 blocks to get the requestQ alright
    for (let index = 0; index < 12; index++) {
      await helper.advanceTime(60 * 60 * 16);
      await TestLib.mineBlock(env);      
    }

    utilities = await UtilitiesTests.new(master.address);

  });

  it("test utilities", async function() {
    var myArr = [];
    for (var i = 50; i >= 0; i--) {
      myArr.push(i);
    }
    utilities = await UtilitiesTests.new(master.address);
    top5N = await utilities.testgetMax5(myArr);
    for (var i = 0; i < 5; i++) {
      assert(top5N["_max"][i] == myArr[i + 1]);
      assert(top5N["_index"][i] == i + 1);
    }
  });

  it("Test possible duplicates on top Requests", async function() {
    const testGetMax = async () => {
      let queue = [0];
      let ref = [0];
      for (var i = 0; i < 50; i++) {
        let x = Math.floor(Math.random() * 998) + 1;
        queue.push(x);
        ref.push(x);
      }
      let res = await utilities.testgetMax5(queue);
      let values = [];
      let idexes = [];

      let tempsorted = queue.sort((a, b) => a - b);
      let sorted = tempsorted.slice(46);
      for (var i = 0; i < 5; i++) {
        values.push(res["0"][i].toNumber());
        idexes.push(res["1"][i].toNumber());
      }
      let svals = values.sort((a, b) => a - b);
      for (var i = 0; i < 5; i++) {
        assert(svals[i] == sorted[i], "Value supposed to be on the top5");
      }
    };

    for (var k = 0; k < 25; k++) {
      await testGetMax();
    }
  });

});
