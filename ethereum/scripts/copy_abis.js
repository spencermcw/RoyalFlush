const fs = require("fs");
const path = require("path");
const { execSync } = require('child_process');

const directory = path.join(__dirname, "../../dApp/src/store/contracts/ABIs");

fs.readdir(directory, (err, files) => {
  if (err) throw err;

  for (const file of files) {
    fs.unlink(path.join(directory, file), (err) => {
      if (err) throw err;
    });
  }
});

const source = path.join(__dirname, "../artifacts/contracts/**/*.json");
const script = `$ cp ${source} ${directory}`
console.log(`Execute the following:\n${script}`);

