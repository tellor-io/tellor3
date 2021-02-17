const { expect } = require("chai");

let UniPairTrbEth = "0x70258aa9830c2c84d855df1d61e12c256f6448b4"
let trbPrice = "38582000000000000000" // This many TRBs equal 1ETH.

let mainnetTRB = "0x0ba45a8b5d5575935b8158a88c631e9f9c95a2e5";

// Small wallet with only TRB ERC20 tokens - less than 1 TRB.
// https://app.zerion.io/0x2e3381202988d535e8185e7089f633f7c9998e83
let wallet_Small_ERC20 = "0x2e3381202988d535e8185e7089f633f7c9998e83"
// Big wallet with only TRB ERC20 tokens - more than 10k TRB.
// https://app.zerion.io/0x58f5f0684c381fcfc203d77b2bba468ebb29b098
let wallet_Big_ERC20 = "0x58f5f0684c381fcfc203d77b2bba468ebb29b098"

// Small wallet with only TRB Uniswap tokens - less than 1 TRB(ETH is converted into TRB)..
// https://app.zerion.io/0x974896e96219dd508100f2ad58921290655072ad
let wallet_Small_Uniswap = "0x974896e96219dd508100f2ad58921290655072ad";
// Big wallet with only TRB Uniswap tokens - more than 2k TRB(ETH is converted into TRB)..
// https://app.zerion.io/0xf7a9ac9abe8e38ec6c30584081de1edf51a0e9b8
let wallet_Big_Uniswap = "0xf7a9ac9abe8e38ec6c30584081de1edf51a0e9b8"

// Small wallet with Uniswap and TRB ERC20 tokens.
// https://app.zerion.io/0x8ab83bdb74fc3573e7fabccf88336b162718961a
let wallet_Small_Uniswap_and_ERC20 = "0x8ab83bdb74fc3573e7fabccf88336b162718961a";
// Big wallet with only TRB ERC20 tokens - more than 10k TRB.
// https://app.zerion.io/0x085fe2d13a9284828a721111612a2b69ea4db4d5
let wallet_Big_Uniswap_and_ERC20 = "0x085fe2d13a9284828a721111612a2b69ea4db4d5"



describe("All tests", function () {

  // Addresses taken from the uniswap token pool holders
  // https://etherscan.io/token/0x70258aa9830c2c84d855df1d61e12c256f6448b4#balances
  // it("Check Uniswap balance", async function () {

  //   {
  //     let actualBalance = Number(await calcUniPrice(wallet_Small_Uniswap))
  //     let expBalance = Number(await uniswapBalancer.trbBalanceOf(wallet_Small_Uniswap))

  //     // This is only very small precision error 13 digits after the point.
  //     expect(expBalance).to.be.closeTo(actualBalance, 30000)
  //   }

  //   {
  //     let actualBalance = Number(await calcUniPrice(wallet_Big_Uniswap))
  //     let expBalance = Number(await uniswapBalancer.trbBalanceOf(wallet_Big_Uniswap))

  //     // This is only very small precision error 13 digits after the point.
  //     expect(expBalance).to.be.closeTo(actualBalance, 30000)
  //   }

  // });

  it("Full simulated migrations", async function () {

    let migrate = async (addr) => {
      let originalBalance = Number(await calcUniPrice(addr))
      let balanceToMigrate = Number(await testee.trbBalanceOfAll(addr))

      // This is only very small precision error - 12 digits after the point.
      expect(originalBalance).to.be.closeTo(balanceToMigrate, 200000)

      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [addr]
      }
      )
      const walletOwner = await ethers.provider.getSigner(addr)
      await testee.connect(walletOwner).migrate()

      console.log('checking balance for ', addr);

      let migratedBalance = Number(await newTellor.balanceOf(addr))
      expect(migratedBalance).to.be.closeTo(originalBalance, 200000)
    }

    // await migrate(wallet_Small_ERC20)
    // await migrate(wallet_Small_ERC20)

    await migrate(wallet_Small_Uniswap)
    await migrate(wallet_Big_Uniswap)


    // await migrate(wallet_Small_Uniswap_and_ERC20)
    // await migrate(wallet_Big_Uniswap_and_ERC20)

  })

  it("No double migrations", async function () {
    expect(1).to.equal(0) // Just a reminder that need to write a test for this.
  })

  it("Migration only own tokens ", async function () {
    expect(1).to.equal(0) // Just a reminder that need to write a test for this.
  })

  it("View migrated totals", async function () {
    expect(1).to.equal(0) // Just a reminder that need to write a test for this.
  })





  // `beforeEach` will run before each test, re-deploying the contract every
  // time. It receives a callback, which can be async.
  beforeEach(async function () {

    // TODO remove this when we have a running oracle version on mainnet and use it directly.
    let fact = await ethers.getContractFactory("contracts/Mocks/TellorTest.sol");
    newTellor = await fact.deploy();
    await newTellor.deployed();

    fact = await ethers.getContractFactory("contracts/TellorStake.sol");
    stake = await fact.deploy();
    await newTellor.deployed();

    fact = await ethers.getContractFactory("TellorMaster");
    master = await fact.deploy(newTellor.address,mainnetTRB);
    await master.deployed();
    master.changeTellorStake(stake.address);

    testee = ITellor.at(master.address)

  });
});

let calcUniPrice = async (addr) => {
  let pair = await ethers.getContractAt("contracts/Interfaces.sol:IUniswapV2Pair", UniPairTrbEth);

  let userBalance = ethers.FixedNumber.from(await pair.balanceOf(addr))
  let totalSupply = ethers.FixedNumber.from(await pair.totalSupply())

  let poolShare = userBalance.divUnsafe(totalSupply);

  let [t1Reserve, t2Reserve,] = await pair.getReserves();

  t1Reserve = ethers.FixedNumber.from(t1Reserve)
  t2Reserve = ethers.FixedNumber.from(t2Reserve)
  let t1Balance = t1Reserve.mulUnsafe(poolShare);
  let t2Balance = t2Reserve.mulUnsafe(poolShare);


  let tPrice = ethers.FixedNumber.from(trbPrice)


  let devider = ethers.FixedNumber.from("1000000000000000000")
  let t2TokenCount = t2Balance.mulUnsafe(tPrice).divUnsafe(devider)
  let t1TotalBalance = t1Balance.addUnsafe(t2TokenCount);

  return t1TotalBalance
}