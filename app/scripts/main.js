'use strict';

/*
 * Game logic
 *
 * Kamisado is a two player game. Each player has 8 pieces on an 8x8 grid (the
 * board).
 *
 * The board is a 2-dimensional array of integers. Since each player has the
 * same pieces, the pieces are simply numbered by color, starting with 1.
 * Player 1's pieces are numbered 1 - 8, and player 2's are 9 - 16.
 *
 * Empty spaces contain a zero.
 *
 * The first player selects a piece, and then a tile to move it to. The color
 * of this tile automatically selects the other player's piece, and the other
 * player must select a place to move to.
 *
 * A player may only move a piece to a spot in a more distant row, diagonally
 * or straight. Pieces may not pass over other pieces.
 *
 * The game is won when one player's piece is on the other player's home row.
 *
 * TODO
 * X. Add ability to save and update session data in the browser.
 *    (which player am I, current board state, etc)
 * 2. Provide some means of communication with the other player.
 *    NB: xmpp looks like a good fit for this
 * 3. Logic for detecting if a move is legal.
 */

/***
 * Utilities and constants
 */

var theBoard;

// Usage: var someArray = Array.repeat(value, lengthOfArray);
Array.prototype.repeat = function(what, L) {
    while (L) {
        this[--L] = what;
    }
    return this;
};

function min(a,b) {
    return (a < b) ? a : b;
}

function supportsLocalStorage() {
    try {
        return 'localStorage' in window &&
            window.localStorage !== null;
    } catch (e) {
        return false;
    }
}

// Helper to determine the raw canvas coordinates.
function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

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

/* Lookup table for the actual hex color values */
var colors = {
    orange: '#F5B437',
    blue: '#3340AE',
    sky: '#1E8AD1',
    pink: '#F8D6C4',
    yellow: '#F6E500',
    red: '#DC442F',
    green: '#BAD360',
    brown: '#6B451E',
    player1: '#080D07',
    player2: '#F4FFF4'
};

/* Number-color assignment. */
var pieceNumberColors = [ 'orange', 'blue', 'sky', 'pink', 'yellow', 'red',
                            'green', 'brown'];

/***
 * Session management
 *
 * Contains the state of the game. The Board will reference this.
 */
function Session() {
    if (location.hash.length > 0) {
        this.gameId = location.hash;
    }
    else {
        this.gameId = guid();
        location.hash = this.gameId;
        this.state = this.initialState();
        this.save();
    }
    this.load();
    console.log(this.gameId);
}

Session.prototype.load = function() {
    this.state = JSON.parse(localStorage.getItem(this.gameId));
    if (this.state === null) {
        this.state = this.initialState();
        this.save();
    }
};

Session.prototype.save = function() {
    localStorage.setItem(this.gameId, JSON.stringify(this.state));
};

/* FIXME this is just a stub */
Session.prototype.whoami = function() {
    return 0;
};

Session.prototype.initialState = function() {

    var theGrid = new Array(8);

    /* Initialize the grid. */
    for (var i = 1; i < 7; i++) {
        theGrid[i] = [].repeat(0, 8);
    }

    /* FIXME
     * Depending on the player number in this session, these two assignments
     * may be switched.
     */
    theGrid[0] = [
        1, 2, 3, 4, 5, 6, 7, 8
    ];
    theGrid[7] = [
        16, 15, 14, 13, 12, 11, 10, 9
    ];

    var state = {
        grid: theGrid,
        selected: {
           x: -1,
           y: -1
        },
        whoAmI: this.whoami(),
        whoseTurn: 0,
    };

    return state;
};

Session.prototype.resetGame = function() {
    this.state = this.initialState();
    this.save();
};

/***
 * Connection
 *
 * Manages a peer-to-peer connection with the other player.
 * Communication is done through the PeerConnection API. Signaling is provided
 * by jingle / an xmpp server.
 */
function Connection(session) {
    this.session = session;
    this.BOSH_SERVICE = 'http://bosh.niltag.net:80/http-bind';
    this.connection = new Strophe.Connection(this.BOSH_SERVICE);
}

Connection.prototype.connect = function() {
    this.connection.connect('test@niltag.net','test',this.onConnect);
};

Connection.prototype.onConnect = function(status) {
    switch (status) {
        case Strophe.Status.CONNECTING:
            console.log('Strophe is connecting');
            break;
        case Strophe.Status.CONNFAIL:
            console.log('Strophe failed to connect');
            break;
        case Strophe.Status.DISCONNECTING:
            console.log('Strophe is disconnecting');
            break;
        case Strophe.Status.DISCONNECTED:
            console.log('Strophe is disconnected');
            break;
        default:
            console.log('Strophe is connected');
            // do something with the connection
    };
};

/***
 * The Board
 *
 * Draws the current state of the game on the canvas and coordinates state
 * changes between a Session and a Connection.
 *
 * Constructor arguments:
 *  bId : the DOM id of the element the canvas is in
 *  session : a Session object
 */
function Board(bId, session) {
    this.elem = document.getElementById(bId);    // DOM element
    this.ctx = this.elem.getElementsByTagName('canvas')[0].getContext('2d');

    /* The arrangement of colors on the board. */
    this.tileColor = [
        ['orange','blue','sky','pink','yellow','red','green','brown'],
        ['red','orange','pink','green','blue','yellow','brown','sky'],
        ['green','pink','orange','red','sky','brown','yellow','blue'],
        ['pink','sky','blue','orange','brown','green','red','yellow'],
        ['yellow','red','green','brown','orange','blue','sky','pink'],
        ['blue','yellow','brown','sky','red','orange','pink','green'],
        ['sky','brown','yellow','blue','green','pink','orange','red'],
        ['brown','green','red','yellow','pink','sky','blue','orange']
    ];
    this.session = session;
    this.connection = new Connection(session);
    this.connection.connect();

    // called every time an event needs to update the screen
    var cW = window.innerWidth;
    var cH = window.innerHeight;

    // the canvas must be a square with an appropriate side length
    this.ctx.canvas.width = 0.9*(min(cH,cW));
    this.ctx.canvas.height = this.ctx.canvas.width;
    this.tileSide = ((0.9*min(cH,cW)) / 8) ;
}

/* Return the board's drawing context. Useful for event handlers. */
Board.prototype.getContext = function() {
    return this.ctx;
};

Board.prototype.draw = function() {
    /*
     * For each coordinate on the board:
     *
     * 1. Lookup the color to draw on the square
     * 2. If there is a piece there (the value in the grid > 0),
     *    2.1 Determine if the piece is selected
     *    2.2 Draw the piece, giving its number, location, and selected status
     */
    for (var x = 0; x < 8; x++) {
        for (var y = 0; y < 8; y++) {
            var theColor = colors[this.tileColor[y][x]];
            this.ctx.fillStyle = theColor;
            this.ctx.fillRect(x*this.tileSide, y*this.tileSide,
                                this.tileSide,   this.tileSide);

            var pc = this.session.state.grid[y][x];
            if (pc !== 0) {
                var selected = (this.session.state.selected.x === x) &&
                               (this.session.state.selected.y === y);
                this.drawPiece(pc, x+1, y+1, selected);
            }
        }
    }
};

Board.prototype.drawPiece = function(piece, x, y, selected) {
    /*
     * Calculate the radius and center of the piece
     * Lookup the bezel (player) and piece colors
     * Draw concentric circles
     *
     * If the piece is selected, draw the bezel again
     */
    var radius = (this.tileSide * 0.9) / 2;
    var center = {
        x: (x*this.tileSide)-(this.tileSide/2),
        y: (y*this.tileSide)-(this.tileSide/2)
    };

    var bezel = (piece > 8) ? colors.player2 : colors.player1;
    var color = colors[pieceNumberColors[(piece-1)%8]];

    // bezel
    this.ctx.beginPath();
    this.ctx.arc(center.x, center.y, radius, 0,
        Math.PI*2, false);
    this.ctx.closePath();
    this.ctx.fillStyle = bezel;
    this.ctx.fill();
    this.ctx.strokeStyle = bezel;
    this.ctx.stroke();

    // piece color
    this.ctx.beginPath();
    this.ctx.arc(center.x, center.y, radius*0.75, 0,
       Math.PI*2, false);
    this.ctx.closePath();
    this.ctx.fillStyle = color;
    this.ctx.fill();
    this.ctx.strokeStyle = color;
    this.ctx.stroke();

    if (selected) {
        this.ctx.beginPath();
        this.ctx.arc(center.x, center.y, radius*0.5, 0,
            Math.PI*2, false);
        this.ctx.fillStyle = bezel;
        this.ctx.fill();
        this.ctx.strokeStyle = bezel;
        this.ctx.stroke();
    }
};


/* Helper for looking up the color of a given board tile */
Board.prototype.colorForPos = function(x, y) {
    return this.tileColor[y-1][x-1];
};

Board.prototype.addContextEvent = function(signal, fn) {
    this.ctx.canvas.addEventListener(signal, fn);
};

Board.prototype.tileAt = function(pos) {
    return {
        x: Math.floor(pos.x / this.tileSide),
        y: Math.floor(pos.y / this.tileSide)
    };
};

/*
 * Handler for click events at a given position.
 * pos is an object containing x and y properties.
 */
Board.prototype.clicked = function(pos) {
    // determine the tile
    var tile = this.tileAt(pos);

    var currentY = this.session.state.selected.y;
    var currentX = this.session.state.selected.x;

    // is this tile already selected?
    if (this.session.state.selected.x === tile.x &&
        this.session.state.selected.y === tile.y) {
        // then unselect it
        this.session.state.selected.x = -1;
        this.session.state.selected.y = -1;
    }
    else {
        if (this.session.state.grid[tile.y][tile.x] > 0) {
            this.session.state.selected.x = tile.x;
            this.session.state.selected.y = tile.y;
        }
        if (this.session.state.grid[tile.y][tile.x] === 0) {
            this.session.state.grid[tile.y][tile.x] =
                this.session.state.grid[currentY][currentX];
            this.session.state.grid[currentY][currentX] = 0;
        }
    }

    this.session.save();
};

Board.prototype.resetGame = function() {
    this.session.resetGame();
    this.draw();
};

function init() {

    if (!supportsLocalStorage()) {
        console.log('localStorage is required to play this game.');
        return;
    }
    theBoard = new Board('board', new Session());
    theBoard.addContextEvent('click', function(evt) {
        var mousePos = getMousePos(this, evt);
        theBoard.clicked(mousePos);
        theBoard.draw();
    }, false);

    document.getElementById('reset').addEventListener('click',function(ev) {
        theBoard.resetGame();
    });

    theBoard.draw();
}

// Let the games begin ...
(function() {
    init();
})();
