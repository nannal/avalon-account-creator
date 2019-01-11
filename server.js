const express = require("express");
var path = require("path");
const bodyParser = require("body-parser");
var cmds = require("./script.js");
var avalon = require("./avalon.js")



//HTTP or HTTPS on remote avalon node
var avaHttps = process.env.AVA_HTTPS || 0
var httpMethod = "http"
if (avaHttps==0){
 var httpMethod = "https"
}
//config for port our service will use
var port = process.env.PORT || 8080

const app = express();

app.use(bodyParser.urlencoded( {extended: true} ));

app.get("/", function (req, res){
    res.sendFile(path.join(__dirname + '/index.html'));
});

console.log(avalon.randomNode());

app.post("/createAccount", function (req, res){
     var userPubKey = req.body.userpubkey;
       avalon.sendTransaction(cmds.createAccount(userPubKey, userPubKey.toLowerCase() ), res.end);
});
app.listen(port);
