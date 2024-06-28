//const deployBase = require("./deployers").deploy
const deployDev = require("./dev.deploy").deploy
//const deployTestNet = require("./testnet.deploy").deploy
require("dotenv").config()

if (process.env.NODE_ENV == "staging") {
  deployTestNet()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
} else if (process.env.NODE_ENV == "development") {
  deployDev()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
} else {
  deployBase()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
