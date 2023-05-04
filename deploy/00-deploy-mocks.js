const { network } = require("hardhat");

const BASE_FEE = "250000000000000000"; // 0.25 LINK or ethers.utils.parseEther("0.25");
const GAS_PRICE_LINK = 1e9; // 0.000000001 LINK per gas

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;

  if (chainId == 31337) { // check if we are on a local network and deploy mocks
    log("Local network detected! Deploying mocks...")
    await deploy("VRFCoordinatorV2Mock", { // deploy vrf coordinator mock
      from: deployer,
      log: true,
      args: [BASE_FEE, GAS_PRICE_LINK],
    })

    log("Mocks Deployed!");
    log("----------------------------------------------------------");
    log("You are deploying to a local network, you'll need a local network running to interact");
    log("Please run `npx hardhat console --network localhost` to interact with the deployed smart contracts!");
    log("----------------------------------------------------------");
  }
}

module.exports.tags = ["all", "mocks"];