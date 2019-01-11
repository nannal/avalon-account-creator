var CryptoJS = require("crypto-js")
const secp256k1 = require('secp256k1')
const bs58 = require('bs58')
var fetch = require("node-fetch");
const { randomBytes } = require('crypto')

//config for user & key, env vars or hardcoded
var sender = process.env.AVA_SENDER || "USER"
var privKey = process.env.AVA_KEY|| "KEY"
//Config for Avalon node we'll be talking to
var avaPort = process.env.AVA_PORT || 3001
var avaAddr = process.env.AVA_ADDR || "localhost"

//HTTP or HTTPS on remote avalon node
var avaHttps = process.env.AVA_HTTPS || 0
var httpMethod = "http"
if (avaHttps==0){
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


let cmds = {
  createAccount: (pub, name) => {
    var tx = '{"type":0,"data":{"pub":"'+pub+'","name":"'+name+'"}}'
    return sign(privKey, sender, tx)                                   // need to set as constant
  }
}

avalon = {
    config: {
        //api: ['https://api.avalon.wtf'],
        api: [httpMethod+'://'+avaAddr+':'+avaPort],
        //api: ['http://127.0.0.1:3001'],
        //api: [httpMethod+'://'+avaAddr+':'+avaPort]
    },
    init: (config) => {
        avalon.config = config
    },
    randomNode: () => {
        var nodes = avalon.config.api
        return nodes[Math.floor(Math.random()*nodes.length)]
    },
    sendTransaction: (tx, cb) => {
        avalon.sendRawTransaction(tx, function(error, headBlock) {
            if (error) {
                cb(error)
            } else {
                setTimeout(function() {
                    avalon.verifyTransaction(tx, headBlock, 5, function(error, block) {
                        if (error) console.log(error)
                        else cb(null, block)
                    })
                }, 1500)
            }
        })
    },
    sendRawTransaction: (tx, cb) => {
        fetch(avalon.randomNode()+'/transact', {
            method: 'post',
            headers: {
              'Accept': 'application/json, text/plain, */*',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(tx)
        }).then(function(res) {
            if (res.status === 500) {
                res.json().then(function(err) {
                    cb(err)
                })
            } else {
                res.text().then(function(headBlock) {
                    cb(null, parseInt(headBlock))
                })
            }

        })
    },
    verifyTransaction: (tx, headBlock, retries, cb) => {
        var nextBlock = headBlock+1
        fetch(avalon.randomNode()+'/block/'+nextBlock, {
            method: 'get',
            headers: {
              'Accept': 'application/json, text/plain, */*',
              'Content-Type': 'application/json'
            }
        }).then(res => res.text()).then(function(text) {
            try {
                var block = JSON.parse(text)
            } catch (error) {
                // block is not yet available, retrying in 1.5 secs
                if (retries <= 0) return
                retries--
                setTimeout(function(){avalon.verifyTransaction(tx, headBlock, retries, cb)}, 1500)
                return
            }

            var isConfirmed = false
            for (let i = 0; i < block.txs.length; i++) {
                if (block.txs[i].hash == tx.hash) {
                    isConfirmed = true
                    break
                }
            }

            if (isConfirmed) {
                cb(null, block)
            } else if (retries > 0) {
                retries--
                setTimeout(function(){avalon.verifyTransaction(tx, nextBlock, retries, cb)},3000)
            } else {
                cb('Failed to find transaction up to block #'+nextBlock)
            }
        });
    }
}

module.exports =  { cmds, avalon }
