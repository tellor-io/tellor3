const helper = require("./test_helpers");

async function mineBlock(env) {
  let vars = await env.master.getNewCurrentVariables();
  let miners = 0;
  let m = [];
  const values = [1, 1, 1, 1, 1];
  const finalVals = [];
  let submitted = {};
  let timestamp;
  for (var i = 0; i < 5; i++) {
    submitted[vars["1"][i].toString()] = [];
  }
  for (var i = 0; i < 5; i++) {
    let minerVals = values.map((value) => {
      return (i + 1) * 1100;
    });
    for (var j = 0; j < 5; j++) {
      submitted[vars["1"][j].toString()].push(minerVals[j]);
    }
    finalVals.push(minerVals);
    try {
      res = await env.master.testSubmitMiningSolution(
        "nonce",
        vars["1"],
        minerVals,
        {
          from: env.accounts[i],
          value: "0",
        }
      );
      m.push(env.accounts[i]);
      miners++;
    } catch (e) {
      console.log(minerVals, vars["1"]);
      assert.isTrue(
        false,
        "miner of index " + i + " couldn't mine a block. Reason: " + e
      );
    }
    if (miners == 5) {
      break;
    }
  }
  let block = await web3.eth.getBlock("latest");
  return {
    miners: m,
    values: finalVals,
    submitted: submitted,
    requests: vars["1"],
    timestamp: block.timestamp,
  };
}
async function depositStake(env) {
    for (var i = 0; i < env.accounts.length; i++) {
      //print tokens
      await env.master.theLazyCoon(env.accounts[i], web3.utils.toWei("7000", "ether"));
      await env.master.depositStake({from: env.accounts[i]})
    }
}
module.exports = {
  mineBlock: mineBlock,
  depositStake: depositStake,
};
