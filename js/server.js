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
    if (game.showcase) {
        // var showcaseAcronym = game.showcaseAcronym[connections.length]
        message = JSON.stringify({
            type: 'showcase',
            name: game.showcasePlayers[connections.length],
            showcaseAcronym: game.showcaseAcronym[connections.length],
        })
    } else {
        message = JSON.stringify({
            type: 'confirm connection',
            text: 'Hi there. You are now connected to the WebSocket Server'
        })
    }
    webSocket.send(message);
    var player = {
        connection:webSocket,
        name: undefined,
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
                // if (game.showcase) {
                //     webSocket.send(JSON.stringify({
                //         type: ""
                //     }))
                // }
                break;
            case "acronymResponses":
                let responsesObject = game.acronymResponses[game.currentRound-1]
                responsesObject[player.name] = clientMessage.acronym

                if (game.playerList.every(player => player.name in responsesObject)) {
                    responsesObject["shuffledList"] = Object.values(responsesObject)
                      .map((value) => ({value, sort: Math.random()}))
                      .sort((a, b) => a.sort - b.sort)
                      .map(({ value }) => value)
                    game.currentMode = "judgeAcromyms"
                    let messageObject = {
                        type: "switchToJudge",
                        currentMode: game.currentMode,
                        responses: responsesObject["shuffledList"],
                    }
                    connections.forEach(function(player, index) {
                        messageObject.playerIndex = responsesObject["shuffledList"].indexOf(responsesObject[player.name])
                        player.connection.send(JSON.stringify(messageObject));
                    })
                }
                break;
            case "acronymVotes":
                let votesObject = game.acronymVotes[game.currentRound-1];
                votesObject[player.name] = clientMessage.votes;

                if (game.playerList.every(player => player.name in votesObject)) {
                    let voteCounts = {};
                    let voteList = Object.values(votesObject).flat(1);
                    voteList.forEach(function(vote) {
                        voteCounts[vote[0]] = (voteCounts[vote[0]] ?? 0) + vote[1]
                    })
                    let sortedScores = Object.entries(voteCounts)
                      .map((voteCount) => ({acronym: voteCount[0], score:voteCount[1]}))
                      .sort((first, second) => second.score - first.score)
                    game.currentMode = "results"
                    let messageObject = {
                        type: "switchToResults",
                        currentMode: game.currentMode,
                        unsortedVotes: voteCounts,
                        sortedVotes: sortedScores,
                    }
                    sendEveryoneWebSocketMessage(messageObject);
                }
                break;
            case "nextRound":
                game.startNextRound();
                break;
        }
    });

    webSocket.on('close', function(reasonCode, description) {
        console.log('Connection from ' + req.socket.remoteAddress + ' disconnected.');
        for (var i = connections.length - 1; i >= 0; i--) {
            if(connections[i]==player){
                connections.splice(i,1);
            }
            // game.showcase = true;
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
    for (var i = connections.length - 1; i >= 0; i--) {
        if(connections[i]==player){
            connections[i].connection.send(JSON.stringify(messageObject));
            return;
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
    acronymVotes: [],
    showcase: false,
    showcasePlayers: [
        "DickTony",
        "mudomo",
        "WesMan",
        "dante6868",
        "Sulfurus",
    ],
    showcaseAcronym: [
        "GrandmaGreasing Lesley's Tired FatiguedFeetToWalkUpPeter'sHill",
        "Granny Licking Titty Fucker",
        "Good Luck? The FukIsYouOn",
        "GhoulsWith Leprosy TakingRefugeInThe Foyer",
        // "GrammaI'd Like To FerociouslyFuckTilSheCroaks",
    ],

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
        game.currentRound++;
        game.currentMode = "writeAcronyms";
        game.acronymLetters.push(game.getRandomLetters(game.acronymLength));

        game.acronymResponses.push([]);
        game.acronymVotes.push([]);
        var messageObject = {
            type: "nextRound",
            acronym: game.acronymLetters[game.currentRound-1],
            roundNumber: game.currentRound,
            mode: game.currentMode
        }

        if (game.showcase) {
            messageObject.acronym = ['G','L','T','F'];
            game.showcase = false;
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