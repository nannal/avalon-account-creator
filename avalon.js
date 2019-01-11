var CryptoJS = require("crypto-js")
const { randomBytes } = require('crypto')
const secp256k1 = require('secp256k1')
const bs58 = require('bs58')
var fetch = require('node-fetch')
//var crypto = (self.crypto || self.msCrypto), QUOTA = 65536;

avalon = {
    config: {
        //api: ['https://api.avalon.wtf'],
        api: ['http://10.0.78.75:3001'],
        //api: ['http://127.0.0.1:3001'],
        //api: [httpMethod+'://'+avaAddr+':'+avaPort]
    },
    init: (config) => {
        avalon.config = config
    },
    randomNode: () => {
        var nodes = avalon.config.api
        return nodes[Math.floor(Math.random()*nodes.length)]
    },sendTransaction: (tx, cb) => {
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

class GrowInt {
    constructor(raw, config) {
        if (!config.min)
            config.min = Number.MIN_SAFE_INTEGER
        if (!config.max)
            config.max = Number.MAX_SAFE_INTEGER
        this.v = raw.v
        this.t = raw.t
        this.config = config
    }

    grow(time) {
        if (time < this.t) return
        if (this.config.growth == 0) return {
            v: this.v,
            t: time
        }

        var tmpValue = this.v
        tmpValue += (time-this.t)*this.config.growth

        if (this.config.growth > 0) {
            var newValue = Math.floor(tmpValue)
            var newTime = Math.ceil(this.t + ((newValue-this.v)/this.config.growth))
        } else {
            var newValue = Math.ceil(tmpValue)
            var newTime = Math.floor(this.t + ((newValue-this.v)/this.config.growth))
        }

        if (newValue > this.config.max)
            newValue = this.config.max

        if (newValue < this.config.min)
            newValue = this.config.min

        return {
            v: newValue,
            t: newTime
        }
    }
}

module.exports =  avalon
