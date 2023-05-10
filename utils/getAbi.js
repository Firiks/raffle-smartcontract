const fs = require("fs")
const path = require("path")

// read cmd args
const args = process.argv.slice(2);
const abi_json_path = args[0];

// get the abi from the json file
const getTheAbi = (abi_json_path) => {
  try {
    const dir = path.resolve(
      __dirname,
      abi_json_path
    );

    const file = fs.readFileSync(dir, "utf8");
    const json = JSON.parse(file);
    const abi = json.abi;
    console.log( JSON.stringify( abi ));

    return abi;
  } catch (e) {
    console.log('Error:', e);
  }
}

getTheAbi(abi_json_path);