"use strict"

// Runs when the page loads
$(window).ready(function() {
    game.init();
});

// Will pretend to be server until I finish server side code
// Afterwards I'll replace it with server code
var dummyServer = {

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
        $('#welcomecontainer').hide();

        var acronymLetters = [];

        for (var _ = 0; _ < game.acronymLength; _++) {
            acronymLetters.push(game.getRandomLetter())
        }

        var $playerCompletionStatusTemplate = $("<div>", {
            class: "playerinfo completionstatus"
        })
        acronymLetters.map(function(letter) {
            //this=$("#acronymdisplay")
            this.append($("<div>", {
                class: "initials uncompleted",
                text: letter
            }))
            $playerCompletionStatusTemplate.append($("<div>", {
                class: "statusinitials uncompleted",
                text: letter
            }))
        }, $("#acronymdisplay"))

        var playerList = [
            {name:"AOoOGH!", score:0},
            {name:"Balcony nut", score:0},
            {name:"Dude From Highschool", score:0},
            {name:"BioDad", score:0},
            {name:"Porto", score:0},
            {name:"Splante", score:0},
            {name:"Zyberzky Ewe", score:0},
        ];

        playerList.map(function(playerInfo, index, array) {
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

            // this=$("#playerList")
            this.append($playerDiv)
        }, $("#playerlist"));

        $('#gamecontainer').show();
        game.switchToWrite();
    },

    // Modes: createLobby, waitingRoom, writeAcronyms, judgeAcromyms, results
    mode: "writeAcronyms",

    switchToWrite: function() {
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
        $('#acronymwriter').hide();
        $('#acronymjudger').show();
        mode = "judgeAcronyms";
    },

    getRandomLetter() {
        // CharCode(65)=>A, CharCode(90)=>Z
        // Math.random() returns a float from the interval [0,1)
        var charCode = Math.floor(Math.random() * 26) + 65
        return String.fromCharCode(charCode)
    }
}