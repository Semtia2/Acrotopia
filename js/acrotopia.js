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
        var coll = document.getElementsByClassName("collapsible");
        var i;

        [...coll].map(function(val, index, array){
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
    },

    // Modes: createLobby, waitingRoom, writeAcronyms, judgeAcromyms, results
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