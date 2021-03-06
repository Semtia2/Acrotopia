"use strict"

// Runs when the page loads
$(window).ready(function() {
    game.init();
    client.initializeWebSocket();
});

const client = {
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
            console.log("Connection opened.");
            this.send(JSON.stringify({type: 'Initialize', message:'A new player has joined'}));
        }

        // Log errors
        this.websocket.onerror = function(error) {
          console.log('WebSocket Error ' + error);
        };

        this.websocket.onclose = function() {
            client.websocket = null;
        };
    },

    sendWebSocketMessage:function(messageObject){
        this.websocket.send(JSON.stringify(messageObject));
    },

    handleWebSocketMessage: function(message) {
        var messageObject = JSON.parse(message.data);
        switch(messageObject.type){
            case "confirm connection":
                console.log(messageObject.text);
                break;
            case "showcase":
                $("#screenname input").val(messageObject.name)
                $("#acronyminput textarea").val(messageObject.showcaseAcronym)
                break;
            case "player_list":
                game.playerList = messageObject.playerList;
                game.updateWaitingRoom();
                break;
            case "startGame":
                game.playerCount = messageObject.playerCount
                game.acronymLength = messageObject.acronymLength
                game.currentRound = 1
                game.startGame()
                break;
            case "nextRound":
                game.currentRound = messageObject.roundNumber
                game.currentMode = messageObject.mode
                game.acronymLetters = messageObject.acronym
                game.switchToWrite(messageObject.acronym)
                break;
            case "switchToJudge":
                game.currentMode = messageObject.currentMode;
                game.acronymResponses[game.currentRound-1] = messageObject.responses;
                game.myResponseIndex = messageObject.playerIndex;
                game.switchToJudge(messageObject.responses);
                break;
            case "switchToResults":
                game.currentMode = messageObject.currentMode;
                game.switchToResults(messageObject.unsortedVotes, messageObject.sortedVotes,);
                break;
        }
    },

    // Called when the host clicks the "Start Game" button
    // Leads to the "startGame" case above
    startGame: function() {
        if(!game.isHost) {
            return;
        }
        client.sendWebSocketMessage({type: "startGame"})
    },

    submitAcronym: function() {
        let entryBox = $("#acronyminput textarea");
        let myAcronym = entryBox.val();
        if (game.validAcronym(myAcronym)) {
            client.sendWebSocketMessage({
                type: "acronymResponses",
                acronym: myAcronym
            })
            $("#acronymsubmit").prop('disabled', true);
            entryBox.prop("disabled", true)
            $("#acronymsubmit").addClass("submitted");
            $("#acronymsubmit").prop('disabled', true);
        }
        else {
            $("#acronymsubmit").prop('disabled', false);
            return;
        }
    },

    submitVotes: function() {
        let voteList = $(".acronymContainer .acronym").get()
                            .map(function(ele, index) {
                                let element = $(ele)
                                return [element.text(), element.hasClass("selected")]
                            })
        $("#finalizevote").addClass("selected");
        $("#finalizevote").prop("disabled", true);
        client.sendWebSocketMessage({
            type: "acronymVotes",
            votes: voteList,
        })
    },

    nextRound: function() {
        if (!game.isHost)
            return;

        client.sendWebSocketMessage({type: "nextRound"})
    }
}

const game = {
    name: undefined,
    isHost: false,
    playerCount: undefined,
    roundCount: 8,
    currentRound: undefined,
    roundTimer: 600,
    acronymLength: undefined,
    lenient: false,
    singleVote: false,
    kick: false,
    acronymLetters: [],
    playerList: [],
    acronymResponses: [],
    myResponseIndex: undefined,

    init: function() {
        // var validateName = function() {
        //     $("#creategame input").prop('disabled', $(this).val().trim() === "");
        // }
        // $("#screenname input")
        // .on("change", validateName)
        // .on("keypress", validateName)
        // .on("keydown", validateName)
        // .on("keyup", validateName)

        $("#creategame input").prop('disabled', false)

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

        // $("#screenname input").val("Balcony nut")
        // game.startGame()
    },

    // Called when the "Join Game" button is clicked
    joinGame: function() {
        game.name = $("#screenname input").val().trim()
        game.currentMode = "waitingRoom"

        client.sendWebSocketMessage({type:"name", name:game.name})

        // game.initializeAcronymWriter();
        // game.initializeAcronymJudger();
        $('#welcomecontainer').hide();
        $('#gamecontainer').show();
    },

    startGame: function() {
        $("#playerlist").css("display", "none");
        $("#gameStart").css("display", "none");

        $("#gameheader #round").text("Round " + game.currentRound + " of " + game.roundCount);
        $("#gameheader").css("display", "flex");

        game.initializeAcronymWriter();
        game.initializeAcronymJudger();
    },

    // Modes: createLobby, waitingRoom, writeAcronyms, judgeAcromyms, results
    currentMode: "createLobby",

    updateWaitingRoom: function() {
        if (game.currentMode != "waitingRoom")
            return;

        $("#playerlist").css("width", "100%").empty()
        game.playerList.map(function(playerInfo, index, array) {
            var $playerDiv = $("<div>", {
                class: "player",
                id: "player"+String(index)
            });

            if(playerInfo.name == game.name)
                $playerDiv.addClass("you")

            var $playerName = $("<div>", {
                class: "playerinfo name"
                }).append($("<div>", {
                    class: "playername",
                    text: playerInfo.name
                })).css("width", "100%")

            $playerDiv
                .append($playerName)

            // this is defined as $("#playerList")
            this.append($playerDiv)
        }, $("#playerlist"));

        if(game.name == game.playerList[0].name) {
            game.isHost = true
            $("#gameStart").css("display", "block")
        } else {
            game.isHost = false
            $("#gameStart").css("display", "none")
        }

        $('#acronymjudger').hide();
        $('#acronymwriter').hide();
    },

    initializeAcronymWriter: function() {
        var $playerCompletionStatusTemplate = $("<div>", {
            class: "playerinfo completionstatus"
        })

        let entryBox = $("#acronyminput textarea");
        entryBox.prop("disabled", false);

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
        }, $("#scoreboard"));
    },

    initializeAcronymJudger: function() {
        // game.switchToJudge();
    },

    switchToWrite: function(acronymLetters) {
        $("#gameheader #round").text("Round " + game.currentRound + " of " + game.roundCount);
        // let entryBox = $("#acronyminput textarea");
        // entryBox.prop("disabled", false);
        // entryBox.val("");

        var $letterDisplayTemplate = $("<div>", {
            id: "letterdisplay"
        })
        var $playerCompletionStatusTemplate = $("<div>", {
            class: "playerinfo completionstatus"
        })
        acronymLetters.map(function(letter) {
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
    },

    switchToJudge: function(acronymResponses) {
        let entryBox = $("#acronyminput textarea");
        entryBox.prop("disabled", false);
        entryBox.val("");

        var $acronymDisplayTemplate = $("<div>", {
            id: "acronymdisplay"
        })
        acronymResponses.map(function(response, index) {
            // The tabs are meant to reflect the html structure.
            if (game.myResponseIndex == index) {
                $acronymDisplayTemplate.append($("<div>", {
                    class: "acronymContainer"
                })
                    .append($("<div>", {
                        class: "acronym acronymContainerDiv",
                        text: response
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
                        text: response
                    })
                        .on("click", function() {
                            this.classList.toggle("selected")
                            $("#finalizevote")
                              .prop('disabled', $("#acronymdisplay .acronym.selected").length < 1);
                        })
                    )
                    .append($("<div>", {
                        class: "result acronymContainerDiv"
                    }))
                )
            }
        })
        $("#acronymdisplay").replaceWith($acronymDisplayTemplate)
        // $("#acronymdisplay .acronym")

        $('#acronymwriter').hide();
        $('#acronymjudger').show();
        game.currentMode = "judgeAcronyms";
    },

    switchToResults: function(unsortedVotes, sortedVotes) {
        var topScore = sortedVotes[0].score
        var $scores = $(".result")
        let $acronyms = $(".acronym");
        $scores.text(index => unsortedVotes[$acronyms[index].textContent])
        $acronyms
          // .text(index => acronymScores[index.acronym])
          .removeClass("selectable")
          .off("click")
          .addClass(index => (unsortedVotes[$acronyms[index].textContent]==topScore)?"winner":"")
        $("#finalizevote").hide()

        if(game.isHost) {
            $("#nextroundbutton").show()
        }
    },

    // Called when the player enters an acronym
    activateSubmit(response) {
        var submitButton = $("#acronymsubmit")
        if (!response) {
            submitButton.prop('disabled', true);
            return
        }
        submitButton.prop('disabled', !game.validAcronym(response));
    },

    validAcronym(response) {
        var words = response.split(/ +(?=\S)/)
        if (words.length == game.acronymLength)
            return game.acronymLetters.every((curr, index) => curr == words[index][0].toUpperCase())
        else
            return false
    },
}