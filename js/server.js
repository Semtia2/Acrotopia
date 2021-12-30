const express = require('express');
const app = express();
const server = require('http').createServer(app);
const WebSocket = require('ws');

const port = 8080;

const wsServer = new WebSocket.Server({ server:server });


server.listen(port, function(){
    console.log(`Server has started listening on port ${port}`);
});

var players = [];
wsServer.on('connection', function(webSocket, req) {
    console.log('Connection from ' + req.socket.remoteAddress + ' accepted.');
    message = JSON.stringify({type: 'confirm connection', text: 'Hi there. You are now connected to the WebSocket Server'})
    webSocket.send(message);
    var player = {
        connection:webSocket,
    }
    players.push(player);

    // On Message event handler for a connection
    webSocket.on('message', function(message) {
        var clientMessage = JSON.parse(message);
        switch (clientMessage.type){
            case "Initialize":
                break;
            case "name":
                player.name = clientMessage.name
                var playerList = players.filter(player=>player.hasOwnProperty('name')).map(player => {return {name: player.name}})
                sendEveryoneWebSocketMessage({type:"player_list", playerList: playerList})
                break;
        }
    });

    webSocket.on('close', function(reasonCode, description) {
        console.log('Connection from ' + req.socket.remoteAddress + ' disconnected.');
        for (var i = players.length - 1; i >= 0; i--) {
            if(players[i]==player){
                players.splice(i,1);
            }
        };
    });
});

function sendEveryoneWebSocketMessage(messageObject){
    var messageString = JSON.stringify(messageObject);
    for (var i = players.length - 1; i >= 0; i--){
        players[i].connection.send(messageString);
    };
}

function sendPlayerWebSocketMessage(player, messageObject){
    var messageString = JSON.stringify(messageObject);
    for (var i = players.length - 1; i >= 0; i--) {
        if(players[i]==player){
            players[i].connection.send(messageString)
        }
    };
}