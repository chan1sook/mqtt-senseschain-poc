const fs = require("fs/promises");
const argon2 = require("argon2");
const aedes = require("aedes")();
const { Web3 } = require("web3");

// generate password
async function generatePassword(password = "12345678") {
  return await argon2.hash("12345678");
}

const web3Rpc = "http://127.0.0.1:8545/";
const contractAddress = "0xD0552DD8058adDE1D705962b92571c6065F1B147";

// start mqtt
async function startMqtt() {
  const web3 = new Web3(web3Rpc);
  const server = require("net").createServer(aedes.handle);
  const port = 1883;

  const contractAbi = JSON.parse(
    (await fs.readFile("MqttBlockchainAcl.json")).toString()
  );
  const aclContract = new web3.eth.Contract(contractAbi.abi, contractAddress);
  aedes.authenticate = async (client, username, password, callback) => {
    // [short/long address]
    try {
      // 1. breakdown username => address:id
      if (!username) {
        return callback(new Error("Username Required"));
      }
      if (!password) {
        return callback(new Error("Password Required"));
      }

      const [address, id] = username.split(":");
      const readData = await aclContract.methods.device(address, id).call();
      if (!readData.active) {
        return callback(new Error("Invalid Username"));
      }

      if (!argon2.verify(readData.hashedpw, password.toString())) {
        return callback(new Error("Invalid Password"));
      }

      client.ethAddress = address;
      console.log(username, "connected");
      return callback(null, true);
    } catch (e) {
      console.error(e);
      callback(null, false);
    }
  };

  // Publish topic logic
  // 1. public topic
  // => public/:your_address/*
  // 2. local topic (same address)
  // => local/:your_address/*

  aedes.authorizePublish = async (client, packet, callback) => {
    if (packet.topic.startsWith("$SYS/")) {
      return callback(new Error("$SYS/ topic is reserved"));
    }

    const [begin, group, tail] = packet.topic.split("/", 3);
    console.log({ begin, group, tail });
    if (begin === "public" || begin === "local") {
      if (group.toLowerCase() === client.ethAddress.toLowerCase()) {
        return callback(null);
      } else {
        return callback(new Error("Invalid group"));
      }
    }

    callback(new Error("Invalid topic"));
  };
  // only match /:address/:any or /public/:address/:name

  // Publish topic logic
  // 1. public topic : anyone can
  // => public/:your_address/*
  // 2. local topic (same address)
  // => local/:your_address/*

  aedes.authorizeSubscribe = async (client, sub, callback) => {
    const [begin, group, tail] = sub.topic.split("/", 3);

    // public topic => allow anyone
    if (begin === "public") {
      return callback(null, sub);
    }

    if (begin === "local") {
      if (group.toLowerCase() === client.ethAddress.toLowerCase()) {
        return callback(null, sub);
      } else {
        return callback(new Error("Invalid group"));
      }
    }

    return callback(new Error("Wrong Topic"));
  };

  server.listen(port, () => {
    console.log("MQTT Server started on port:", port);
  });
}
(async () => {
  if (process.argv.indexOf("--genpw") !== -1) {
    console.log(await generatePassword());
  } else {
    startMqtt();
  }
})();
