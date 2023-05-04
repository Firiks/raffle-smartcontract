# Smart contract for the Ethereum blockchain that allows users to enter a lottery.

Users can join the lottery by sending a minimum amount of ether to the contract. The contract will then randomly select a winner and send the entire balance to the winner.
Winner is picked in specific interval by Chainlink Upkeep.

Project is setup using Hardhat. Main configg is in `hardhat.config.js`. Additional network config is in `helper-hardhat-config.js`

## Quick start
1. Clone the repo
2. Install dependencies: `npm install`
3. Create .env file from .env.example `cp .env.example .env` and fill in the values
4. To run tests: `npx hardhat test`
5. To run local node with contract deployed run: `npm run chain`
6. To deploy on testnet: `npm run deploy-sepolia`