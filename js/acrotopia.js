"use strict"

// Runs when the page loads
$(window).ready(function() {
    game.init();
});

// Will pretend to be server until I finish server side code
// Afterwards I'll replace it with server code
var dummyServer = {
    acronymResponses: [
        {player: "AOoOGH", acronym: "My love for you is bulletproof but you're the one who shot me"},
        {player: "Balcony nut", acronym: "You must stick up for yourself son"},
        {player: "Dude From Highschool", acronym: "I wrote Jesus Walks, I'm never gonna hell"},
        {player: "BioDad", acronym: "I can't believe that it's always like this"}
    ],

    pushToServer: function(message) {
        if (message.type !== 'utf8')
            return

        var clientMessage = JSON.parse(message.utf8Data);
        switch (clientMessage.type) {
            case "acronym":
                dummyServer.acronymResponses.push({player:"Porto", acronym:clientMessage.acronym})
                break;
        }
    }

}

var client = {
    websocket_url:"ws://localhost:8080/",
    websocket:undefined,
}

var game = {
    playerCount: 7,
    roundCount: 8,
    roundTimer: 600,
    acronymLength: 4,
    lenient: false,
    singleVote: false,
    kick: false,
    acronymLetters: [],
    playerList: [
        {name:"AOoOGH!", score:0},
        {name:"Balcony nut", score:0},
        {name:"Dude From Highschool", score:0},
        {name:"BioDad", score:0},
        {name:"Porto", score:0},
        {name:"Splante", score:0},
        {name:"Zyberzky Ewe", score:0},
    ],
    acronymResponses: [
        {player: "", acronym: "My love for you is bulletproof but you're the one who shot me"},
        {player: "Balcony nut", acronym: "You must stick up for yourself son"},
        {player: "", acronym: "I wrote Jesus Walks, I'm never gonna hell"},
        {player: "", acronym: "I can't believe that it's always like this"}
    ],

    init: function() {
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

        $("#creategame input").click();
    },

    startGame: function() {
        game.initializeAcronymWriter();
        game.initializeAcronymJudger();
        $('#welcomecontainer').hide();
        $('#gamecontainer').show();
    },

    // Modes: createLobby, waitingRoom, writeAcronyms, judgeAcromyms, results
    mode: "writeAcronyms",

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
            $acronymDisplayTemplate.append($("<div>", {
                class: "acronym",
                text: response.acronym
            }).on("click", function(){
                this.classList.toggle("selected")
                $("#finalizevote").prop('disabled', $("#acronymdisplay .acronym.selected").length < 1);
            })
            )
        })
        $("#acronymdisplay").replaceWith($acronymDisplayTemplate)
        $("#acronymdisplay .acronym")

        $('#acronymwriter').hide();
        $('#acronymjudger').show();
        game.mode = "judgeAcronyms";
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