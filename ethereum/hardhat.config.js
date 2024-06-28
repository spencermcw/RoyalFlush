require("dotenv").config();
require("@nomicfoundation/hardhat-ethers");

const {
  API_URL,
  PRIVATE_KEY
} = process.env;


// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();
  console.log(account.address);
  //for (const account of accounts) {
  //  console.log(account.address);
  //}
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const walletKey = process.env.DEPLOYMENT_WALLET_KEY;

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  // https://hardhat.org/hardhat-runner/docs/reference/solidity-support
  solidity: "0.8.24",
  networks: {
    local: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    },
    testnet: {
      url: "https://bsc-testnet-dataseed.bnbchain.org",
      chainId: 97,
      accounts: [walletKey]
    }
  }
};
