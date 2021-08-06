$(window).ready(function() {
    game.init();
})

// Will pretend to be server until I finish client side code
// Afterwards I'll replace it with server code
var dummyServer = {

}

var client = {
    websocket_url:"ws://localhost:8080/",
    websocket:undefined,
}

var game = {
    init: function() {
        // idk
    },

    // Modes: enterLobby, createLobby, writeAcronyms, judgeAcromyms, results
    mode: "writeAcronyms",

    switchToWrite: function() {
        $('#acronymjudger').hide();
        $('#acronymwriter').show();
        mode = "writeAcronyms";
    },

    switchToJudge: function() {
        $('#acronymwriter').hide();
        $('#acronymjudger').show();
        mode = "judgeAcronyms";
    },
}