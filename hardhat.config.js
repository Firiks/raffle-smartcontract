/**
 * Hardhat configuration
 */

// include plugins
require('@nomicfoundation/hardhat-network-helpers');
require('@nomicfoundation/hardhat-chai-matchers');
require('@nomicfoundation/hardhat-toolbox');
require('@nomiclabs/hardhat-etherscan');
require('@nomiclabs/hardhat-ethers');
require('hardhat-contract-sizer');
require('hardhat-gas-reporter');
require('hardhat-deploy');
require('solidity-coverage');

// load .env
require("dotenv").config();

// constant
const MAINNET_RPC_URL = process.env.MAINNET_RPC_URL || process.env.ALCHEMY_MAINNET_RPC_URL || "https://eth-mainnet.alchemyapi.io/v2/your-api-key"
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "https://eth-sepolia.g.alchemy.com/v2/YOUR-API-KEY"
const POLYGON_MAINNET_RPC_URL = process.env.POLYGON_MAINNET_RPC_URL || "https://polygon-mainnet.alchemyapi.io/v2/your-api-key"
const GOERLI_RPC_URL = process.env.GOERLI_RPC_URL || "https://eth-mainnet.alchemyapi.io/v2/your-api-key";
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "your private key";
const MNEMONIC = process.env.MNEMONIC || "your mnemonic"
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "Your etherscan API key";
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY || "Your polygonscan API key"

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  defaultNetwork: "hardhat", // used as default, stops after job is done
  networks: {
    goerli: { // add goerli testnet
      url: GOERLI_RPC_URL,
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
      chainId: 5,
      blockConfirmations: 6, // how many block confirmations to wait
    },
    localhost: { // use localhost node that runs using `npx hardhat node`, runs until stopped manualy
      url: "http://127.0.0.1:8545/",
      chainId: 31337 // localhost chain id for hardhat
      // gasPrice: 130000000000,
    },
    hardhat: {
      chainId: 31337, // localhost chain id for hardhat
    },
    sepolia: { // add sepolia testnet
      url: SEPOLIA_RPC_URL,
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
      saveDeployments: true,
      chainId: 11155111,
    },
    mainnet: { // mainet
      url: MAINNET_RPC_URL,
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
      //   accounts: {
      //     mnemonic: MNEMONIC, // use mnemonic to generate accounts
      //   },
      saveDeployments: true,
      chainId: 1, // 1 is always mainnet
    },
    polygon: { // polygon mainnet
      url: POLYGON_MAINNET_RPC_URL,
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
      saveDeployments: true,
      chainId: 137,
    },
  },
  solidity: { // manage solidity compiler versions
    compilers: [ // handle multiple versions of solidity
      {
        version: "0.8.8",
      },
      {
        version: "0.8.4",
      },
      {
        version: "0.8.0",
      }
    ],
  },
  etherscan: { // etherscan verification, run with `npx hardhat verify --network mainnet {contract address} {constructor arguments}`
    apiKey: {
      sepolia: ETHERSCAN_API_KEY,
      polygon: POLYGONSCAN_API_KEY,
    },
    customChains: [
      {
        network: "goerli",
        chainId: 5,
        urls: {
          apiURL: "https://api-goerli.etherscan.io/api",
          browserURL: "https://goerli.etherscan.io",
        },
      },
    ],
  },
  gasReporter: { // enable gas reporting & export it to file
    enabled: true,
    // outputFile: "gas-report.txt",
    // noColors: true,
    currency: "USD",
    coinmarketcap: COINMARKETCAP_API_KEY, // get real currency values
    // token: "MATIC"
  },
  namedAccounts: { // named accounts for easy access, access using
    deployer: {
      default: 0, // here this will by default take the first account as deployer
      // {chainID}: {accountID}
      1: 0, // similarly on mainnet it will take the first account as deployer. Note though that depending on how hardhat network are configured, the account 0 on one network can be different than on another
      player: {
        default: 1, // here this will by default take the second account as player
      }
    },
  },
  contractSizer: { // enable contract size reporting
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: false,
    only: ["Raffle"],
  },
  mocha: {
    timeout: 500000, // 500 seconds max for running tests
    // bail: true, // stop after first test failure
  }
};