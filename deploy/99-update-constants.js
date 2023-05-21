const fs = require("fs");
const path = require("path");
const { network, ethers } = require("hardhat");

const contractAddressFile = path.join(__dirname, "../constants/contract-address.json");
const contractABIFile = path.join(__dirname, "../constants/contract-abi.json");

async function updateAbi() {
  const raffle = await ethers.getContract("Raffle");
  fs.writeFileSync(contractABIFile, raffle.interface.format(ethers.utils.FormatTypes.json))
}

async function updateContractAddresses() {
  const raffle = await ethers.getContract("Raffle");
  const contractAddresses = JSON.parse(fs.readFileSync(contractAddressFile, "utf8"))
  
  if (network.config.chainId.toString() in contractAddresses) { 
    if (!contractAddresses[network.config.chainId.toString()].includes(raffle.address)) {
      contractAddresses[network.config.chainId.toString()].push(raffle.address);
    }
  } else {
    contractAddresses[network.config.chainId.toString()] = [raffle.address];
  }

  fs.writeFileSync(contractAddressFile, JSON.stringify(contractAddresses));
}

module.exports = async () => {
  console.log("Writing to constants...");

  if ( !fs.existsSync(contractAddressFile) ) {
    fs.writeFileSync(contractAddressFile, "{}");
  }

  if ( !fs.existsSync(contractABIFile) ) {
    fs.writeFileSync(contractABIFile, "{}");
  }

  await updateContractAddresses();
  await updateAbi();
  console.log("constants written!");
}

module.exports.tags = ["all", "frontend"];