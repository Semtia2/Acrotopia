const express = require('express');
const app = express();
const server = require('http').createServer(app);
const WebSocket = require('ws');

const port = 8080;

const wsServer = new WebSocket.Server({ server:server });


server.listen(port, function(){
    console.log(`Server has started listening on port ${port}`);
});

//  the order of this list is based on when the player first opens the page
var connections = [];
wsServer.on('connection', function(webSocket, req) {
    console.log('Connection from ' + req.socket.remoteAddress + ' accepted.');
    message = JSON.stringify({type: 'confirm connection', text: 'Hi there. You are now connected to the WebSocket Server'})
    webSocket.send(message);
    var player = {
        connection:webSocket,
    }
    connections.push(player);

    // On Message event handler for a connection
    webSocket.on('message', function(messageJSON) {
        var clientMessage = JSON.parse(messageJSON);
        switch (clientMessage.type) {
            case "Initialize":
                break;
            case "name":
                player.name = clientMessage.name
                game.playerList.push({
                    name: player.name,
                    score:0
                })
                game.hostName = game.playerList[0].name;
                sendEveryoneWebSocketMessage({type:"player_list", playerList: game.playerList})
                break;
            case "startGame":
                game.initializeGame();
                break;
        }
    });

    webSocket.on('close', function(reasonCode, description) {
        console.log('Connection from ' + req.socket.remoteAddress + ' disconnected.');
        for (var i = connections.length - 1; i >= 0; i--) {
            if(connections[i]==player){
                connections.splice(i,1);
            }
        };
        for (var j = game.playerList.length - 1; j >= 0; j--) {
            if(game.playerList[j].name==player.name){
                game.playerList.splice(j,1);
            }
        };
        sendEveryoneWebSocketMessage({type:"player_list", playerList: game.playerList})
    });
});

function sendEveryoneWebSocketMessage(messageObject) {
    var messageString = JSON.stringify(messageObject);
    for (var i = connections.length - 1; i >= 0; i--){
        connections[i].connection.send(messageString);
    };
}

function sendPlayerWebSocketMessage(player, messageObject) {
    var messageString = JSON.stringify(messageObject);
    for (var i = connections.length - 1; i >= 0; i--) {
        if(connections[i]==player){
            connections[i].connection.send(messageString)
        }
    };
}

const game = {
    // the order of this list is based on when the player enters a name
    playerList: [],
    hostName: undefined,
    // Modes: createLobby, waitingRoom, writeAcronyms, judgeAcromyms, results
    currentMode: "waitingRoom",
    playerCount: undefined,
    roundCount: 8,
    currentRound: 0,
    roundTimer: 120,
    acronymLength: 4,
    lenient: false,
    singleVote: false,
    kick: false,
    acronymLetters: [],
    acronymResponses: [],

    initializeGame: function() {
        game.playerCount = game.playerList.length

        sendEveryoneWebSocketMessage({
            type:"startGame",
            playerCount: game.playerCount,
            acronymLength: game.acronymLength,
        })
        game.startNextRound()
    },

    startNextRound: function() {
        game.currentRound++
        game.acronymLetters.push(game.getRandomLetters(game.acronymLength))
        var messageObject = {
            type: "nextRound",
            acronym: acronymLetters[game.currentRound],
            roundNumber: game.currentRound,
            mode: game.currentMode
        }

        sendEveryoneWebSocketMessage(messageObject)
    },

    getRandomLetters: function(howMany) {
        // CharCode(65)=>A, CharCode(90)=>Z
        // Math.random() returns a float from the interval [0,1)
        randomLetters = [];
        for (var _ = 0; _ < howMany; _++)
            randomLetters.push(String.fromCharCode(Math.floor(Math.random() * 26) + 65))
        return randomLetters
    },
}