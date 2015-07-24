(function() {
    'use strict';

    /*
     * Implementation notes:
     *
     * - a grid is indexed (y,x) because ultimately it's easier for me to
     *   write array literals indexed like this
     */

    /*
     * Application declarations and definitions
     */
    var element = document.getElementById('board'),
        context = element.getElementsByTagName('canvas')[0].getContext('2d'),
        wWidth = window.innerWidth,
        wHeight = window.innerHeight - 50,
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

    // globally unique ID generator
    // usage: guid() -- different output each time
    var guid = (function() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }

        return function() {
            return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
                   s4() + '-' + s4() + s4() + s4();
        };
    })();

    function parseHash() {
        var hash = location.hash.slice(1);
        if (hash === '') {
            hash = guid();
            location.hash = '#' + hash;
        }
        return hash;
    }

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

    // comonadic wrapper around a grid state
    function Board(grid, pos, gameId, selected, player) {
        this.grid = grid;
        this.pos   = pos;

        this.selected = typeof selected !== 'undefined'
            ? selected
            : null;

        this.player = typeof player !== 'undefined'
            ? player
            : 0;

        this.gameId = typeof gameId !== 'undefined'
            ? gameId
            : 'test-game';
    }

    Board.prototype.save = function() {
        var state = {
            grid     : this.grid,
            player   : this.player,
            gameId   : this.gameId,
            selected : this.selected
        };
        localStorage.setItem(this.gameId,
                JSON.stringify(state));
        console.log('saved as gameId = ' + this.gameId);
    };

    Board.prototype.updatePos = function(pos) {
        this.pos = pos;
        return this;
    };

    Board.prototype.extract = function() {
        return this.grid[this.pos.y][this.pos.x];
    };

    Board.prototype.duplicate = function() {
        var me = this, oldGrid = this.grid;
        var x, y, grid = [];
        for (y = 0; y < me.grid.length; y++) {
            grid[y] = [];
            for (x = 0; x < me.grid[y].length; x++) {
                grid[y][x] = new Board(oldGrid, new Pos(x, y),
                                       me.gameId, me.selected,
                                       me.player);
            }
        }
        this.grid = grid;
        return this;
    };

    Board.prototype.map = function(f) {
        var x, y, grid = [], me = this;
        for (y = 0; y < me.grid.length; y++) {
            grid[y] = [];
            for (x = 0; x < me.grid[y].length; x++) {
                grid[y][x] = f(me.grid[y][x]);
            }
        }
        this.grid = grid;
        return this;
    };

    Board.prototype.extend = Comonad.prototype.extend;

    // Called on every refresh for each cell on the grid.
    function drawCell (ptr) { return new IO(function() {

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
        var color = colors[(cell - 1) % 8];

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
    }).start(); }

    Board.prototype.drawCells = function() {
        return this.extend(drawCell);
    };

    // Called from clicked(), so this.pos is the position that has been
    // clicked. The piece is starting from this.selected
    Board.prototype.legalMove = function() {
        // direction dependent: if the current player is 0, they are going
        // "down" the page, and vice versa for player 1.

        // FIXME
        // This does not take into account if any pieces are blocking you
        return ((this.player ? this.selected.y > this.pos.y
                             : this.selected.y < this.pos.y)
            &&  (this.extract() === 0)
            && ((Math.abs(this.selected.x - this.pos.x) ===
                 Math.abs(this.selected.y - this.pos.y))
            ||  (this.selected.x - this.pos.x) === 0));
    };

    Board.prototype.clicked = function(clickPos) {
        var cell = this.updatePos(clickPos).extract();
        console.log("Clicked: x = " + this.pos.x + ", y = " + this.pos.y);
        console.log(this.extract());

        if (this.selected === null) {
            this.selected = new Pos(-1, -1);
        }

        // is this cell already selected?
        if (this.selected.x === this.pos.x &&
            this.selected.y === this.pos.y) {
            // do nothing
            this.player = (this.player) ? 0 : 1;
            this.selectNextPiece();
            return this;
        }

        else {
            // not selected and the cell contains a piece
            // -> select this new piece
            if (cell > 0) {
                this.selected = this.pos;
            }

            // not selected and cell does not contain a piece
            // -> move the currently selected piece here
            if (cell === 0) {
                if (!this.legalMove()) {
                    return this;
                }
                // else ...
                this.grid[this.pos.y][this.pos.x] =
                    this.grid[this.selected.y][this.selected.x];
                this.grid[this.selected.y][this.selected.x] = 0;

                this.selected.x = this.pos.x;
                this.selected.y = this.pos.y;

                this.player = (this.player) ? 0 : 1 ;
                console.log("moved. switched to player " + this.player);

            }
        }

        this.selectNextPiece();
        this.save();
        return this;
    };

    Board.prototype.selectNextPiece = function() {
        var x, y, nextCell;
        var selectedColor = tileColorPattern[this.selected.y][this.selected.x];
        var nextPiece = (selectedColor + 1) + (this.player * 8);
        for (y = 0; y < this.grid.length; y++) {
            for (x = 0; x < this.grid[y].length; x++) {
                nextCell = this.grid[y][x];
                if (nextCell === nextPiece) {
                    this.selected.x = x;
                    this.selected.y = y;
                    break;
                }
            }
        }
    };

    function getBoard() {
        return new IO(function() {
            var hash = parseHash();
            var saved = JSON.parse(localStorage.getItem(hash));
            if (saved === null) {
                var grid = [], y;
                for (y = 1; y < (size-1); y++) {
                    grid[y] = [].repeat(0, 8);
                }
                grid[0] = [  1,  2,  3,  4,  5,  6,  7, 8 ];
                grid[7] = [ 16, 15, 14, 13, 12, 11, 10, 9 ];
                return new Board(grid, new Pos(0, 0), hash);
            }
            else {
                return new Board(saved.grid, new Pos(0, 0),
                                 saved.gameId,
                                 saved.selected, saved.player);
            }
        });
    }

    setup = new IO(function() {
        context.canvas.width = 0.9*(min(wWidth, wHeight));
        context.canvas.height = context.canvas.width;
        tileSide = ((0.9*min(wWidth, wHeight)) / size);
        radius = (tileSide * 0.9) / 2;
    });

    function listen(board) {
        return new IO(function() {
            context.canvas.addEventListener('click', function(evt) {
                var mousePos = getMousePos(this, evt);
                mousePos.x = Math.floor(mousePos.x / tileSide);
                mousePos.y = Math.floor(mousePos.y / tileSide);
                board.
                    clicked(mousePos).
                    drawCells();
            });
            document.getElementById('new-game')
                .addEventListener('click', function() {
                console.log("clicked new game");
                location.hash = '';
                location.reload();
            });
        });
    }

    main = setup.
            chain(getBoard).
            chain(function (board) { return new IO.of(board.drawCells()); }).
            chain(listen);

    main.start();

})();
