# TODO MQTT Concept
- connect => ...
- read acl in blockchain
    - username: ....account:device_name
    password: .... raw password => check by hashing
    hash_of(account,device_name,pw)

- after login => passive mode [connected but no message action except sign]
websocket /sign/:account/:device_name "sign_message"
  required sign message for approve connection
  => sign message 
  => send sign message to mqtt server (via seperate websocket)
  => retrive & check
  => if match: changew device to active mode
active mode => do things
ttl : 5 min (for disconnect issue)


blockchain data

devices[account] = array of device_names
public_acl[account] = {
    topic: *, _, account [Account1:any, Account2, ...]
}
maybe string encoded

= {
    device_name: keccak256(account + device_name + pw)
}

mqtt check by read username, raw pw