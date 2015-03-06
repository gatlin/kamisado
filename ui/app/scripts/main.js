(function() {
    'use strict';

    /*
     * Implementation notes:
     *
     * - a board is indexed (y,x) because ultimately it's easier for me to
     *   write array literals indexed like this
     */

    /*
     * Application declarations and definitions
     */
    var element = document.getElementById('board'),
        context = element.getElementsByTagName('canvas')[0].getContext('2d'),
        wWidth = window.innerWidth,
        wHeight = window.innerHeight,
        size = 8,
        tileSide,
        radius,
        setup,
        main;

    /*
     * Color configuration
     */
    var colors = [
        '#F5B437', // 0:  orange
        '#3340AE', // 1:  blue
        '#1E8AD1', // 2:  sky
        '#F8D6C4', // 3:  pink
        '#F6E500', // 4:  yellow
        '#DC442F', // 5:  red
        '#BAD360', // 6:  green
        '#6B451E', // 7:  brown
        '#080D07', // 8:  player 0
        '#F4FFF4'  // 9:  player 1
    ];

    var tileColorPattern = [
        [0,1,2,3,4,5,6,7],
        [5,0,3,6,1,4,7,2],
        [6,3,0,5,2,7,4,1],
        [3,2,1,0,7,6,5,4],
        [4,5,6,7,0,1,2,3],
        [1,4,7,2,5,0,3,6],
        [2,7,4,1,6,3,0,5],
        [7,6,5,4,3,2,1,0]
    ];

    /*
     * Utilities
     */

    function min(a,b) {
        return (a < b) ? a : b;
    }

    Array.prototype.repeat = function(what, L) {
        while (L) {
            this[--L] = what;
        }
        return this;
    };

    // simple coordinate pair
    function Pos(x, y) {
        this.x = x;
        this.y = y;
    }

    function getMousePos(canvas, evt) {
        var rect = canvas.getBoundingClientRect();
        return new Pos(evt.clientX - rect.left,
                       evt.clientY - rect.top);
    }

    // comonadic wrapper around a board state
    function Pointer(board, pos, selected, player) {
        this.board = board;
        this.pos   = pos;

        this.selected = typeof selected !== 'undefined'
            ? selected
            : null;

        this.player = typeof player !== 'undefined'
            ? player
            : 0;
    }

    Pointer.prototype.updatePos = function(pos) {
        this.pos = pos;
        return this;
    };

    Pointer.prototype.extract = function() {
        return this.board[this.pos.y][this.pos.x];
    };

    Pointer.prototype.extend = function(f) {
        var board = [], x, y;
        for (y = 0; y < this.board.length; y++) {
            board[y] = [];
            for (x = 0; x < this.board[y].length; x++) {
                board[y][x] = f(new Pointer(this.board, new Pos(x, y),
                            this.selected, this.player));
            }
        }
        this.board = board;
        return this;
    };

    Pointer.prototype.drawCells = function() {
        return this.extend(drawCell);
    }

    Pointer.prototype.clicked = function(clickPos) {
        var cell = this.updatePos(clickPos).extract();

        if (this.selected === null) {
            this.selected = new Pos(-1, -1);
        }

        // is this cell already selected?
        if (this.selected.x === clickPos.x &&
            this.selected.y === clickPos.y) {
            // do nothing
            return this;
        }

        else {
            // not selected and the cell contains a piece
            // -> select this new piece
            if (cell > 0) {
                this.selected = clickPos;
            }

            // not selected and cell does not contain a piece
            // -> move the currently selected piece here
            // -> select the corresponding other person's piece
            if (cell === 0) {
                this.board[clickPos.y][clickPos.x] =
                    this.board[this.selected.y][this.selected.x];
                this.board[this.selected.y][this.selected.x] = 0;

                this.selected = clickPos;
                this.player = (this.player) ? 0 : 1;

                console.log("moved. switched to player " + this.player);
            }
        }

        return this;
    }

    function selectNextPiece (ptr) {
        var selectedColor = tileColorPattern[ptr.selected.y][ptr.selected.x];
        var nextPiece = (selectedColor + 1) + (ptr.player * 8);
        var x = ptr.pos.x, y = ptr.pos.y, cell = ptr.extract();
        if (cell === nextPiece) {
            ptr.selected.x = x;
            ptr.selected.y = y;
        }
        return cell;
    };

    // IO monad
    function IO (unsafePerformIO) {
        this.unsafePerformIO = unsafePerformIO;
    }

    IO.of = function(o) {
        return new IO(function() {
            return o;
        });
    };

    IO.prototype.chain = function(f) {
        var io = this;
        return new IO (function() {
            return f(io.unsafePerformIO()).unsafePerformIO();
        });
    };

    IO.prototype.fork = function() {
        var io = this;
        return new IO (function() {
            setTimeout(function() {
                io.unsafePerformIO();
            }, 0);
        });
    };

    function generateBoard() {
        return new IO (function() {
            var board = [], y;
            for (y = 1; y < (size-1); y++) {
                board[y] = [].repeat(0, 8);
            }
            board[0] = [  1,  2,  3,  4,  5,  6,  7, 8 ];
            board[7] = [ 16, 15, 14, 13, 12, 11, 10, 9 ];
            return new Pointer(board, new Pos(0, 0));
        });
    }

    // Called on every refresh for each cell on the board.
    function drawCell (ptr) {
        // draw the background color
        var cell = ptr.extract();
        var cellColor = colors[tileColorPattern[ptr.pos.y][ptr.pos.x]];
        context.fillStyle = cellColor;
        context.fillRect(ptr.pos.x * tileSide, ptr.pos.y * tileSide,
                                     tileSide,             tileSide);

        if (cell === 0) { return cell; }

        // if there is a piece on this cell, draw it as well
        var x = ptr.pos.x + 1;
        var y = ptr.pos.y + 1;
        var center = {
            x: ((x) * tileSide) - (tileSide / 2),
            y: ((y) * tileSide) - (tileSide / 2)
        };

        var bezel = (cell > size) ? colors[9] : colors[8];
        var color = colors[(cell -1)%8];

        // bezel
        context.beginPath();
        context.arc(center.x, center.y, radius, 0,
                Math.PI*2, false);
        context.closePath();
        context.fillStyle = bezel;
        context.fill();
        context.strokeStyle = bezel;
        context.stroke();

        // piece color
        context.beginPath();
        context.arc(center.x, center.y, radius * 0.75, 0,
                Math.PI*2, false);
        context.closePath();
        context.fillStyle = color;
        context.fill();
        context.strokeStyle = color;
        context.stroke();

        if (ptr.selected !== null         &&
            ptr.selected.x === ptr.pos.x &&
            ptr.selected.y === ptr.pos.y) {
            context.beginPath();
            context.arc(center.x, center.y, radius * 0.5, 0,
                    Math.PI*2, false);
            context.fillStyle = bezel;
            context.fill();
            context.strokeStyle = bezel;
            context.stroke();
        }

        return cell;
    }

    setup = new IO (function() {
        context.canvas.width = 0.9*(min(wWidth, wHeight));
        context.canvas.height = context.canvas.width;
        tileSide = ((0.9*min(wWidth, wHeight)) / size);
        radius = (tileSide * 0.9) / 2;
    });

    function listen(boardPtr) {
        return new IO(function() {
            context.canvas.addEventListener('click', function(evt) {
                var mousePos = getMousePos(this, evt);
                mousePos.x = Math.floor(mousePos.x / tileSide);
                mousePos.y = Math.floor(mousePos.y / tileSide);
                boardPtr.
                    clicked(mousePos).
                    extend(selectNextPiece).
                    drawCells();

            });
        });
    }

    main = setup.
            chain(generateBoard).
            chain(function (boardPtr) { return new IO.of(boardPtr.drawCells()) }).
            chain(listen);

    main.unsafePerformIO();

})();
