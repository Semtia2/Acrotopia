"use strict"

// Runs when the page loads
$(window).ready(function() {
    game.init();
});

var client = {
    websocket_url:"ws://localhost:8080/",
    websocket:undefined,

    initializeWebSocket: function() {
        var WebSocketObject = window.WebSocket || window.MozWebSocket;
        if(!WebSocketObject){
            game.showMessageBox("Your Browser does not support WebSockets. Acrotopia will not work.");
            return;
        }
        this.websocket = new WebSocketObject(this.websocket_url);
        this.websocket.onmessage = client.handleWebSocketMessage;
        this.websocket.onopen = function(){
            // Hide the starting menu layer
            client.sendWebSocketMessage({type: 'Initialize', message:'A new player has joined'});
        }

        // Log errors
        this.websocket.onerror = function(error) {
          console.log('WebSocket Error ' + error);
        };

        // Log messages from the server
        this.websocket.onmessage = function(e) {
          console.log('Server: ' + e.data);
        };
    },

    sendWebSocketMessage:function(messageObject){
        this.websocket.send(JSON.stringify(messageObject));
    },

    handleWebSocketMessage: function(message){
        var messageObject = JSON.parse(message.data);
        switch(messageObject.type){
            case "player_list":
                game.playerList = messageObject.playerList;
                game.updateWaitingRoom();
                break;
        }
    },
}

var game = {
    name: undefined,
    playerCount: 7,
    roundCount: 8,
    roundTimer: 600,
    acronymLength: 4,
    lenient: false,
    singleVote: false,
    kick: false,
    acronymLetters: [],
    playerList: [],
    acronymResponses: [
        {player: "", acronym: "My love for you is bulletproof but you're the one who shot me", score:4},
        {player: "Balcony nut", acronym: "You must stick up for yourself son", score:2},
        {player: "", acronym: "I wrote Jesus Walks, I'm never gonna hell", score:1},
        {player: "", acronym: "I can't believe that it's always like this", score:0}
    ],

    init: function() {
        var validateName = function() {
            $("#creategame input").prop('disabled', $(this).val().trim() === "");
        }
        $("#screenname input")
        .on("change", validateName)
        .on("keypress", validateName)
        .on("keydown", validateName)
        .on("keyup", validateName)

        var coll = document.getElementsByClassName("collapsible");
        var i;

        [...coll].map(function(val){
            val.addEventListener("click", function(){
                this.classList.toggle("active");
                var content = this.nextElementSibling;
                if(content.style.display === "block") {
                    content.style.display = "none";
                } else {
                    content.style.display = "block";
                }
            })
        })

        // $("#creategame input").click();
    },

    startGame: function() {
        game.name = $("#screenname input").val().trim()

        client.initializeWebSocket();
        client.sendWebSocketMessage({type:"name", name:game.name})

        game.initializeAcronymWriter();
        game.initializeAcronymJudger();
        $('#welcomecontainer').hide();
        $('#gamecontainer').show();
    },

    // Modes: createLobby, waitingRoom, writeAcronyms, judgeAcromyms, results
    mode: "writeAcronyms",

    updateWaitingRoom: function() {
        if (mode != "waitingRoom")
            return;

        var $playerCompletionStatusTemplate = $("<div>", {
            class: "playerinfo completionstatus"
        })

        game.playerList.map(function(playerInfo, index, array) {
            var $playerDiv = $("<div>", {
                class: "player",
                id: "player"+String(index)
            });

            var $playerName = $("<div>", {
                class: "playerinfo name"
                }).append($("<div>", {
                    class: "playername",
                    text: playerInfo.name
                })).append($("<div>", {
                    class: "score",
                    text: "Score: " + playerInfo.score
                }))

            var $playerCompletionStatus = $playerCompletionStatusTemplate.clone()

            var $playerKick = $("<div>", {
                class: "playerinfo kickcontainer"
                }).append($("<input>", {
                    type: "button",
                    class: "playerinfo",
                    hidden: "true",
                    value: "KICK?"
                }))

            $playerDiv
                .append($playerName)
                .append($playerCompletionStatus)
                .append($playerKick)

            // this is defined as $("#playerList")
            this.append($playerDiv)
        }, $("#playerlist"));
    },

    initializeAcronymWriter: function() {
        var $playerCompletionStatusTemplate = $("<div>", {
            class: "playerinfo completionstatus"
        })

        game.playerList.map(function(playerInfo, index, array) {
            var $playerDiv = $("<div>", {
                class: "player",
                id: "player"+String(index)
            });

            var $playerName = $("<div>", {
                class: "playerinfo name"
                }).append($("<div>", {
                    class: "playername",
                    text: playerInfo.name
                })).append($("<div>", {
                    class: "score",
                    text: "Score: " + playerInfo.score
                }))

            var $playerCompletionStatus = $playerCompletionStatusTemplate.clone()

            var $playerKick = $("<div>", {
                class: "playerinfo kickcontainer"
                }).append($("<input>", {
                    type: "button",
                    class: "playerinfo",
                    hidden: "true",
                    value: "KICK?"
                }))

            $playerDiv
                .append($playerName)
                .append($playerCompletionStatus)
                .append($playerKick)

            // this is defined as $("#playerList")
            this.append($playerDiv)
        }, $("#playerlist"));

        game.switchToWrite();
    },

    initializeAcronymJudger: function() {
        game.switchToJudge();
    },

    switchToWrite: function() {
        game.acronymLetters = [];
        for (var _ = 0; _ < game.acronymLength; _++) {
            game.acronymLetters.push(game.getRandomLetter())
        }

        var $letterDisplayTemplate = $("<div>", {
            id: "letterdisplay"
        })
        var $playerCompletionStatusTemplate = $("<div>", {
            class: "playerinfo completionstatus"
        })
        game.acronymLetters.map(function(letter) {
            // this is defined as $("#letterdisplay")
            $letterDisplayTemplate.append($("<div>", {
                class: "initials uncompleted",
                text: letter
            }))
            $playerCompletionStatusTemplate.append($("<div>", {
                class: "statusinitials uncompleted",
                text: letter
            }))
        })

        $("#letterdisplay").replaceWith($letterDisplayTemplate);
        $(".completionstatus").replaceWith($playerCompletionStatusTemplate);

        $('#acronymjudger').hide();
        $('#acronymwriter').show();
        var $acronymInput = $('#acronyminput textarea')
        var extraLineSpace = 1
        var baseHeight = $acronymInput[0].scrollHeight
            - parseInt($acronymInput.css("padding-top"))
            - parseInt($acronymInput.css("padding-bottom"))
            + extraLineSpace
        $acronymInput
            .height(baseHeight)
            .autoResize({
                animate: false,
                extraSpace : extraLineSpace
            });

        game.mode = "writeAcronyms";
    },

    switchToJudge: function() {
        var $acronymDisplayTemplate = $("<div>", {
            id: "acronymdisplay"
        })
        game.acronymResponses.map(function(response) {
            // The tabs are meant to reflect the html structure.
            if (response.player == game.name) {
                $acronymDisplayTemplate.append($("<div>", {
                    class: "acronymContainer"
                })
                    .append($("<div>", {
                        class: "acronym acronymContainerDiv",
                        text: response.acronym
                    }))
                    .append($("<div>", {
                        class: "result acronymContainerDiv"
                    }))
                )
            }
            else {
                $acronymDisplayTemplate.append($("<div>", {
                    class: "acronymContainer"
                })
                    .append($("<div>", {
                        class: "acronym selectable acronymContainerDiv",
                        text: response.acronym
                    })
                        .on("click", function(){
                            this.classList.toggle("selected")
                            $("#finalizevote").prop('disabled', $("#acronymdisplay .acronym.selected").length < 1);
                        })
                    )
                    .append($("<div>", {
                        class: "result acronymContainerDiv"
                    }))
                )
            }
        })
        $("#acronymdisplay").replaceWith($acronymDisplayTemplate)
        $("#acronymdisplay .acronym")

        $('#acronymwriter').hide();
        $('#acronymjudger').show();
        game.mode = "judgeAcronyms";
    },

    switchToResults: function() {
        var sortedResponses = game.acronymResponses.slice(0).sort((first, second) => second.score - first.score)
        var topScore = sortedResponses[0].score
        var $scores = $(".result")
        $scores.text(index => game.acronymResponses[index].score)
        $(".acronym").removeClass("selectable").off("click")
        // .addClass(index => (game.acronymResponses[index].score==topScore)?"winner":"")
        .addClass(function(index) {
            return (game.acronymResponses[index].score==topScore)?"winner":""
        })
    },

    getRandomLetter() {
        // CharCode(65)=>A, CharCode(90)=>Z
        // Math.random() returns a float from the interval [0,1)
        var charCode = Math.floor(Math.random() * 26) + 65
        return String.fromCharCode(charCode)
    },

    activateSubmit(response) {
        if (!response)
            return
        var submitButton = $("#acronymsubmit")
        submitButton.prop('disabled', !game.validAcronym(response));
    },

    validAcronym(response) {
        var words = response.split(/ +(?=\S)/)
        if (words.length == game.acronymLength)
            return game.acronymLetters.every((curr, index) => curr == words[index][0].toUpperCase())
        else
            return false
    },

    submit() {
        var messageObject = {type:"acronym", acronym:$('#acronyminput textarea').value}
        dummyServer.pushToServer(JSON.stringify(messageObject))
    }
}