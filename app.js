var kamisado_port = process.env.KAMISADO_PORT;

if (typeof kamisado_port === "undefined") {
    kamisado_port = 8080;
}

var WebSocketServer = require('ws').Server
  , wss = new WebSocketServer({ port: kamisado_port });

/* A game contains the websocket connections of all participants */
function Game(gameId) {
    this.gameId = gameId;
    this.players = [null, null];
}

Game.prototype.broadcast = function(message) {
    this.players.forEach(function(pl) {
        if (pl !== null) {
            pl.send(message);
        }
    });
};

/* In-memory storage of active games */
var games = {};

/*
 * Usage: var newGuid = guid();
 * Lovingly stolen from:
 *   http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
 */
var guid = (function() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }

    return function() {
        return s4() + s4 () + '-' + s4() + '-' + s4() + '-' +
               s4() + '-' + s4() + s4() + s4();
    };
})();

function newGame(ws) {
    var gameId = guid();
    games[gameId] = new Game(gameId);
    games[gameId].players[0] = ws;
    games[gameId].broadcast("new 0 " + gameId);
}


wss.on("connection", function(ws) {

    ws.on("message", function(message) {
        var tokens = message.split(/[ \t]+/);
        switch (tokens[0]) {
        case "new":
            newGame(ws);
            break;

        case "join":
            var gameId = tokens[1];
            var playerNum = tokens[2];
            if (!(gameId in games)) {
                newGame(ws);
            }
            else {
                games[gameId].players[playerNum] = ws;
                games[gameId].broadcast("joined " + gameId);
                console.log("Player " + playerNum + " joined game " + gameId);
            }
            break;

        case "msg":
            var gameId = tokens[1];
            var msg = tokens.slice(2).join(" ");
            games[gameId].broadcast("msg " + msg);

        default:
            console.log("huh?");
        }
    });

});


