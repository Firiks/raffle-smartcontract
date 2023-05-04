/**
 * Additional network configs
 */

// VRF docs https://docs.chain.link/vrf/v2/subscription/supported-networks

const { ethers } = require("hardhat");

const networkConfig = {
  default: {
    name: "hardhat",
    keepersUpdateInterval: "30",
  },
  1: {
    name: "mainnet",
    keepersUpdateInterval: "30",
  },
  11155111: {
    name: "sepolia",
    subscriptionId: "6926",
    gasLane: "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c", // gass lane address for 30 gwei,
    keepersUpdateInterval: "30", // 30 seconds to update keepers
    raffleEntranceFee: ethers.utils.parseEther("0.01"), // 0.01 ETH
    callbackGasLimit: "500000", // 500,000 gas
    vrfCoordinatorV2: "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625", // VRF Coordinator V2 address
  },
  31337: {
    name: "localhost",
    subscriptionId: "588",
    gasLane: "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c", // its not used in the mock
    keepersUpdateInterval: "30", // 30 seconds to update keepers
    raffleEntranceFee: ethers.utils.parseEther("0.01"), // 0.01 ETH
    callbackGasLimit: "500000", // 500,000 gas
  },
}

const developmentChains = ["hardhat", "localhost"]; // keep track of development chains
const VERIFICATION_BLOCK_CONFIRMATIONS = 6;

module.exports = {
  networkConfig,
  developmentChains,
  VERIFICATION_BLOCK_CONFIRMATIONS,
}