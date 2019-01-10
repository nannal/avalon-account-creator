const express = require("express");
var path = require("path");
const bodyParser = require("body-parser");
var {cmds, sendTx} = require("./script.js");

//config for port our service will use
var port = process.env.PORT || 8080

const app = express();

app.use(bodyParser.urlencoded( {extended: true} ));

app.get("/", function (req, res){
    res.sendFile(path.join(__dirname + '/index.html'));
    res.sendFile(path.join(__dirname + '/style.css'));
    res.sendFile(path.join(__dirname + '/script.js'));
});

app.post("/createAccount", function (req, res){
     var userPubKey = req.body.userpubkey;
     console.log(userPubKey.length)
     if (!userPubKey.length === [44-45]){
      res.end("Incorrect Input");

    } else if ( !Boolean(userPubKey.match(/^[a-zA-Z0-9]+$/)) ){
      res.end("Incorrect Input");

    } else {
       sendTx(cmds.createAccount(userPubKey, userPubKey.toLowerCase() ));
       res.end(userPubKey.toLowerCase()+" Account Generated");

     };
});
app.listen(port);
