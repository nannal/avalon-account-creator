var CryptoJS = require("crypto-js")
const secp256k1 = require('secp256k1')
const bs58 = require('bs58')
var fetch = require("node-fetch");

//config for user & key, env vars or hardcoded
var sender = process.env.AVA_SENDER || "USER"
var privKey = process.env.AVA_KEY|| "KEY"
//Config for Avalon node we'll be talking to
var avaPort = process.env.AVA_PORT || 3001
var avaAddr = process.env.AVA_ADDR || "localhost"
//HTTP or HTTPS on remote avalon node
var avaHttps = process.env.AVA_HTTPS || 0
var httpMethod = "http"
if (avaHttps==1){
 var httpMethod = "https"
}

let sign = (privKey, sender, tx) => {
	// will return a new transaction with a hash and a signature
	tx = JSON.parse(tx)
	tx.sender = sender
	// add timestamp to seed the hash (avoid transactions reuse)
	tx.ts = new Date().getTime()
	// hash the transaction
	tx.hash = CryptoJS.SHA256(JSON.stringify(tx)).toString()
	// sign the transaction
	var signature = secp256k1.sign(new Buffer.from(tx.hash, "hex"), bs58.decode(privKey))
	tx.signature = bs58.encode(signature.signature)
	return tx
}

function sendTx(tx) {
  console.log("Sending to: "+ httpMethod+'://'+avaAddr+':'+avaPort+'/transact')
	fetch(httpMethod+'://'+avaAddr+':'+avaPort+'/transact', {
		method: 'post',
		headers: {
		  'Accept': 'application/json, text/plain, */*',
		  'Content-Type': 'application/json'
		},
		body: JSON.stringify(tx)
	}).then(function(res) {
		console.log(res.statusText)
	});
}


let cmds = {
  createAccount: (pub, name) => {
    var tx = '{"type":0,"data":{"pub":"'+pub+'","name":"'+name+'"}}'
    return sign(privKey, sender, tx)                                   // need to set as constant
  }
}

module.exports =  { cmds, sendTx}
