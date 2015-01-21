var kamisado_port = process.env.KAMISADO_PORT;

if (typeof kamisado_port === "undefined") {
    kamisado_port = 8080;
}

var sys = require('sys');
var net = require('net');
var WebSocketServer = require('ws').Server
  , wss = new WebSocketServer({ port: kamisado_port });

var games = {};

function Game(gameId) {
    this.gameId = gameId;
    this.player1 = null;
    this.player2 = null;
}

Game.prototype.broadcast = function(message) {
    [this.player1, this.player2].forEach(function(pl) {
        if (pl !== null) {
            pl.send(message);
        }
    });
};

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

wss.on("connection", function(ws) {

    ws.on("message", function(message) {
        var tokens = message.split(/[ \t]+/);
        switch (tokens[0]) {
        case "new":
            var gameId = guid();
            games[gameId] = new Game(gameId);
            games[gameId].player1 = ws;
            games[gameId].broadcast("new " + gameId);
            break;

        case "join":
            var gameId = tokens[1];
            games[gameId].player2 = ws;
            games[gameId].broadcast("joined " + gameId);
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


