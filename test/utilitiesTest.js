const { artifacts } = require("hardhat");
const Master = artifacts.require("./TellorMaster.sol")
const Tellor = artifacts.require("./TellorTest.sol")
const ITellor = artifacts.require("./ITellor")
const UtilitiesTests = artifacts.require("./UtilitiesTest")
const helper = require("./helpers/test_helpers");
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
    tellorMaster = await Master.new(tellor.address)
    master = await ITellor.at(tellorMaster.address)

    for (var i = 0; i < accounts.length; i++) {
      //print tokens
      await master.theLazyCoon(accounts[i], web3.utils.toWei("7000", "ether"));
    }

    for (let index = 1; index < 58; index++) {
      await master.addTip(index, 1);
    }
  });

    it("test utilities", async function() {
    var myArr = [];
    for (var i = 50; i >= 0; i--) {
      myArr.push(i);
    }
    utilities = await UtilitiesTests.new(master.address);
    top5N = await utilities.testgetMax5(myArr);
    let q = await master.getRequestQ();
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

  it("Test getMax payout and index 51 req with overlapping tips and requests", async function() {
    utilities = await UtilitiesTests.new(master.address);
    for (var i = 1; i <= 21; i++) {
      await master.addTip(i, i, { from: accounts[2] });
    }
    for (var j = 15; j <= 45; j++) {
      apix = "api" + j;
      await master.addTip(j, j, { from: accounts[2] });
    }
    max = await utilities.testgetMax();
    assert(max["0"].toString() == "45", "Max should be 45");
    assert(max["1"].toString() == "6", "Max should be 6"); //note first 5 are added
  });
  it("Test getMax payout and index 60 requests", async function() {
    utilities = await UtilitiesTests.new(master.address);
    let queue = [0];
    let ref = [0];
    for (var i = 1; i < 60; i++) {
      let x = Math.floor(Math.random() * 998) + 1;
      await master.addTip(i, x);
      queue.push(x);
      ref.push(x);
    }
    let res = await utilities.testgetMax(queue);
    let values = [];
    let idexes = [];

    let tempsorted = queue.sort((a, b) => a - b);
    let sorted = tempsorted.slice(46);
    for (var i = 0; i < res.length; i++) {
      values.push(res["0"][i].toNumber());
      idexes.push(res["1"][i].toNumber());
    }
    let svals = values.sort((a, b) => a - b);
    for (var i = 0; i < res.length; i++) {
      assert(svals[i] == sorted[i], "Value supposed to be on the top5");
    }
  });

  it("Test getMax payout and index 100 requests", async function() {
    utilities = await UtilitiesTests.new(master.address);
    let queue = [0];
    let ref = [0];
    for (var i = 1; i < 100; i++) {
      let x = Math.floor(Math.random() * 998) + 1;
      await master.addTip(i, x);
      queue.push(x);
      ref.push(x);
    }
    let res = await utilities.testgetMax(queue);
    let values = [];
    let idexes = [];

    let tempsorted = queue.sort((a, b) => a - b);
    let sorted = tempsorted.slice(46);
    for (var i = 0; i < res.length; i++) {
      values.push(res["0"][i].toNumber());
      idexes.push(res["1"][i].toNumber());
    }
    let svals = values.sort((a, b) => a - b);
    for (var i = 0; i < res.length; i++) {
      assert(svals[i] == sorted[i], "Value supposed to be on the top5");
    }
  });

  it("Timestamp on Q", async () => {
    utilities = await UtilitiesTests.new(master.address);
    apiVars = await master.getRequestVars(1);
    apiIdforpayoutPoolIndex = await master.getRequestIdByRequestQIndex(0);
    apiId = await master.getRequestIdByQueryHash(apiVars[2]);
    assert(
      web3.utils.hexToNumberString(apiId) == 1,
      "timestamp on Q should be 1"
    );
  });

  it("utilities Test getMin payout and index 10 req with overlapping tips and requests", async function() {
    utilities = await UtilitiesTests.new(master.address);
    let queue = [0];
    let ref = [[0, 0]];
    for (var i = 1; i < 60; i++) {
      let x = Math.floor(Math.random() * 998) + 1;
      await master.addTip(i, x);
      queue.push(x);
      ref.push([i, x]);
    }
    let res = await utilities.testgetMax(queue);
    let values = [];
    let idexes = [];

    let tempsorted = queue.sort((a, b) => a - b);
    let sorted = tempsorted.slice(46);
    for (var i = 0; i < res.length; i++) {
      values.push(res["0"][i].toNumber());
      idexes.push(res["1"][i].toNumber());
    }
    let svals = values.sort((a, b) => a - b);
    let sref = values.sort((a, b) => a[1] - b[1]);
    for (var i = 0; i < res.length; i++) {
      assert(
        svals[i] == sorted[res.length - 1 - i],
        "Value supposed to be on the top5"
      );
      assert(sref[i[0]] == res["0"], "Id supposed to be on correct");
    }
  });

  it("Test get min with known array", async function() {
    const testGetMin = async () => {
      let queue = [0];
      let ref = [0];
      for (var i = 0; i < 50; i++) {
        let x = Math.floor(Math.random() * 998) + 1;
        queue.push(x);
        ref.push(x);
      }

      let res = await utilities.testgetMins(queue);
      let value = res["0"].toNumber();
      let index = res["1"].toNumber();

      let tempsorted = queue.sort((a, b) => a - b);
      assert(value == tempsorted[1], "Value supposed to be on the top5");
    };

    for (var k = 0; k < 25; k++) {
      await testGetMin();
    }
  });

  //Double check on this 2 test cases
  it("Test getMin payout and index 51 req count down with overlapping tips and requests", async function() {
    // utilities = await UtilitiesTests.new(master.address);

    let vars = await master.getNewCurrentVariables();

    let ids = vars["1"].map((i) => {
      return i.toNumber();
    });

    let queue = [0];
    let ref = [[0, 0]];
    for (var i = 1; i < 90; i++) {
      let x = i + 1;
      await master.addTip(i, x);
      if (ids.indexOf(i) == -1) {
        queue.push(x);
      } else {
        queue.push(1);
      }
    }


    for (var i = 1; i < 90; i = i + 5) {
      let x = i + 1;
      await master.addTip(i, x);
      queue[i] = queue[i] + x;
    }

    let svals = queue.sort((a, b) => a - b);
    let q = svals.slice(-51);
    //await printRequestQ();
    min = await utilities.testgetMin();
    assert(min[0].toString() == q[0], "Min value should be correct");
  });

  it("Test getMin payout and index 55 requests", async function() {
    utilities = await UtilitiesTests.new(master.address);
    for (var i = 1; i <= 55; i++) {
      await master.addTip(i, i, {
        from: accounts[2],
      });
    }
    req = await master.getRequestQ();
    min = await utilities.testgetMins(req);
    assert(min[0] == 1, "Min should be 1");
    assert(min[1] == 50, "Min index should be 50");
  });
});
