/**
 * This script is used to mock the off-chain keeper functionality.
 */

const { ethers, network } = require("hardhat");
const { networkConfig } = require("../helper-hardhat-config");

async function mockKeepers() {
  // if network is local, increase time
  if (network.config.chainId == 31337) {
    const interval = parseInt(networkConfig[network.config.chainId].keepersUpdateInterval) + 1;
    console.log(`Increasing time by ${interval} seconds...`);
    await network.provider.send("evm_increaseTime", [interval]); // increase/decrease time by value
    await network.provider.request({ method: "evm_mine"}); // mine the next block
  }

  const raffle = await ethers.getContract("Raffle");
  const checkData = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(""));
  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep(checkData);
  if (upkeepNeeded) {
    const tx = await raffle.performUpkeep(checkData);
    const txReceipt = await tx.wait(1);
    const requestId = txReceipt.events[1].args.requestId;
    console.log(`Performed upkeep with RequestId: ${requestId}`);
    if (network.config.chainId == 31337) {
      await mockVrf(requestId, raffle);
    }
  } else {
    console.log("No upkeep needed!");
  }
}

async function mockVrf(requestId, raffle) {
  console.log("We on a local network? Ok let's pretend...");
  const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");
  await vrfCoordinatorV2Mock.fulfillRandomWords(requestId, raffle.address);
  console.log("Responded!");
  const recentWinner = await raffle.getRecentWinner();
  console.log(`The winner is: ${recentWinner}`);
}

mockKeepers()
  .then(() => process.exit(0))
  .catch((error) => {
      console.error(error);
      process.exit(1);
  });