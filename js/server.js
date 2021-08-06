var WebSocketServer = require('websocket').server;
var http = require('http');

// Create a simple web server that returns the same response for any request
var server = http.createServer(function(request,response){
    response.writeHead(200, {'Content-Type': 'text/plain'});
    response.end("This is the node.js HTTP server.");
});

server.listen(8080,function(){
    console.log('Server has started listening on port 8080');
});

var wsServer = new WebSocketServer({
    httpServer:server,
    autoAcceptConnections: false
});

// Logic to determine whether a specified connection is allowed.
function connectionIsAllowed(request){
    // Check criteria such as request.origin, request.remoteAddress
    return true;
}

var players = [];
wsServer.on('request',function(request){
    if(!connectionIsAllowed(request)){
        request.reject();
        console.log('Connection from ' + request.remoteAddress + ' rejected.');
        return;
    }

    var connection = request.accept();
    var player = {
        connection:connection,
        latencyTrips:[],
    }
    players.push(player);

    // Measure latency for player
    measureLatency(player);

    // On Message event handler for a connection
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            var clientMessage = JSON.parse(message.utf8Data);
            switch (clientMessage.type){
            }
        }
    });

    connection.on('close', function(reasonCode, description) {
        console.log('Connection from ' + request.remoteAddress + ' disconnected.');
        for (var i = players.length - 1; i >= 0; i--) {
            if(players[i]==player){
                players.splice(i,1);
            }
        };

        // If the player is in a room, remove them from room and notify everyone
        if(player.room){
            var status = player.room.status;
            var roomId = player.room.roomId;
        }
    });
});