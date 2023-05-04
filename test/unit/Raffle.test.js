/**
 * Unit tests for the Raffle contract - local network only
 */

const { assert, expect } = require("chai");
const { network, deployments, ethers } = require("hardhat");
const { developmentChains, networkConfig } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Raffle Unit Tests", async function () {
      let raffle, raffleContract, vrfCoordinatorV2Mock, raffleEntranceFee, interval, player, deployer;

      const evmEncreaseTime = async (value) => {
        await network.provider.send("evm_increaseTime", [interval.toNumber() + (value)]); // increase/decrease time by value
        await network.provider.request({ method: "evm_mine"}); // mine the next block
      }

      // runs before each test in this block
      beforeEach(async () => {
        accounts = await ethers.getSigners(); // could also do with getNamedAccounts
        deployer = accounts[0];
        player = accounts[1];
        await deployments.fixture(["mocks", "raffle"]); // deploy the contracts, run this once per test
        vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");
        raffleContract = await ethers.getContract("Raffle"); // new connection to the Raffle contract
        raffle = raffleContract.connect(player); // new instance of the Raffle contract connected to player
        raffleEntranceFee = await raffle.getEntranceFee();
        interval = await raffle.getInterval();
      });

      // test constructor state
      describe("constructor", () => {
        it("intitiallizes the raffle correctly", async () => {
          const raffleState = (await raffle.getRaffleState()).toString();
          assert.equal(raffleState, "0");
          assert.equal(
            interval.toString(),
            networkConfig[network.config.chainId]["keepersUpdateInterval"]
          );
        });
      });

      // test entering raffle
      describe("enterRaffle", () => {
        it("reverts when you don't pay enough", async () => {
          await expect(raffle.enterRaffle()).to.be.revertedWithCustomError(raffle, 'Raffle__SendMoreToEnterRaffle');
        });

        it("records player when they enter", async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee });
          const contractPlayer = await raffle.getPlayer(0);
          assert.equal(player.address, contractPlayer);
        });

        it("records player when they enter", async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee });
          const contractPlayer = await raffle.getPlayer(0);
          assert.equal(player.address, contractPlayer);
        });

        it("emits event on enter", async () => {
          await expect(raffle.enterRaffle({ value: raffleEntranceFee })).to.emit(
            raffle,
            "RaffleEnter"
          );
        });

        it("doesn't allow entrance when raffle is calculating", async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee });
          evmEncreaseTime(1);
          // we pretend to be a keeper for a second
          await raffle.performUpkeep([]); // this will set the raffle state to calculating
          await expect(raffle.enterRaffle({ value: raffleEntranceFee })).to.be.revertedWithCustomError(raffle, 'Raffle__RaffleNotOpen');
        });
      });
      
      // test raffle during upkeep
      describe("checkUpkeep", () => {
        it("returns false if people haven't sent any ETH", async () => {
          evmEncreaseTime(1);
          const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x");
          assert(!upkeepNeeded);
        });

        it("returns false if raffle isn't open", async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee });
          evmEncreaseTime(1);
          await raffle.performUpkeep([]); // start calculating
          const raffleState = await raffle.getRaffleState();
          const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x"); // get the raffle state, 0x is same as []
          assert.equal(raffleState.toString() == "1", upkeepNeeded == false);
        });

        it("returns false if enough time hasn't passed", async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee });
          evmEncreaseTime(-1);
          const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x");
          assert(!upkeepNeeded);
        });

        it("returns true if enough time has passed, has players, eth, and is open", async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send("evm_increaseTime", [3600]); // increase time by 1 hour
          await network.provider.request({ method: "evm_mine"}); // mine the next block
          const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x");
          assert(upkeepNeeded); // upkeepNeeded should be true
        });
      });

      describe("performUpkeep", () => {
        it("can only run if checkupkeep is true", async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee });
          evmEncreaseTime(1);
          const tx = await raffle.performUpkeep("0x");
          assert(tx);
        });

        it("reverts if checkup is false", async () => {
          await expect(raffle.performUpkeep("0x")).to.be.revertedWithCustomError(raffle, 'Raffle__UpkeepNotNeeded');
        });

        it("updates the raffle state, latest timestamp, and emits a requestId", async () => {
          evmEncreaseTime(1); // we need to increase time so that the raffle is open
          await raffle.enterRaffle({ value: raffleEntranceFee })
          const startingTimeStamp = await raffle.getLastTimeStamp();
          const txResponse = await raffle.performUpkeep("0x");
          const txReceipt = await txResponse.wait(1);
          evmEncreaseTime(1); // increase time again so that we can check the ending timestamp
          const endingTimeStamp = await raffle.getLastTimeStamp();
          const raffleState = await raffle.getRaffleState();
          const requestId = txReceipt.events[1].args.requestId;
          assert(requestId.toNumber() > 0);
          assert(raffleState == 1); // // 0 = open, 1 = calculating
          assert(endingTimeStamp > startingTimeStamp);
        });
      });

      describe("fulfillRandomWords", function () {
      beforeEach(async () => {
        await raffle.enterRaffle({ value: raffleEntranceFee });
        evmEncreaseTime(1);
      });

      it("can only be called after performupkeep", async () => {
        await expect(
          vrfCoordinatorV2Mock.fulfillRandomWords(0, raffle.address) // reverts if not fulfilled
        ).to.be.revertedWith("nonexistent request");

        await expect(
          vrfCoordinatorV2Mock.fulfillRandomWords(1, raffle.address) // reverts if not fulfilled
        ).to.be.revertedWith("nonexistent request");
      });

      it("picks a winner, resets, and sends money", async () => {
        const additionalEntrances = 3; // to test
        const startingIndex = 2;
        for (let i = startingIndex; i < startingIndex + additionalEntrances; i++) {
          raffle = raffleContract.connect(accounts[i]); // returns a new instance of the Raffle contract connected to player
          await raffle.enterRaffle({ value: raffleEntranceFee });
        }

        const startingTimeStamp = await raffle.getLastTimeStamp(); // stores starting timestamp (before we fire our event)

        // This will be more important for our staging tests...
        await new Promise(async (resolve, reject) => {
          raffle.once("WinnerPicked", async () => { // event listener for WinnerPicked
            console.log("WinnerPicked event fired!")
            // assert throws an error if it fails, so we need to wrap
            // it in a try/catch so that the promise returns event
            // if it fails.
            try {
              // Now lets get the ending values...
              const recentWinner = await raffle.getRecentWinner();
              const raffleState = await raffle.getRaffleState();
              const winnerBalance = await accounts[2].getBalance();
              const endingTimeStamp = await raffle.getLastTimeStamp();
              await expect(raffle.getPlayer(0)).to.be.reverted;
              // Comparisons to check if our ending values are correct:
              assert.equal(recentWinner.toString(), accounts[2].address);
              assert.equal(raffleState, 0);
              assert.equal(
                winnerBalance.toString(), 
                startingBalance.add(raffleEntranceFee.mul(additionalEntrances).add(raffleEntranceFee)).toString() // // startingBalance + ( (raffleEntranceFee * additionalEntrances) + raffleEntranceFee )
              );
              assert(endingTimeStamp > startingTimeStamp);
              resolve(); // if try passes, resolves the promise 
            } catch (e) { 
                reject(e); // if try fails, rejects the promise
            }
          });

          // kicking off the event by mocking the chainlink keepers and vrf coordinator
          const tx = await raffle.performUpkeep("0x");
          const txReceipt = await tx.wait(1);
          const startingBalance = await accounts[2].getBalance();
          await vrfCoordinatorV2Mock.fulfillRandomWords(
            txReceipt.events[1].args.requestId,
            raffle.address
          );
        });
      });
    });
  });