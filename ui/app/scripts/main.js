(function() {
    'use strict';

    /*
     * Implementation notes:
     *
     * - a grid is indexed (y,x) because ultimately it's easier for me to
     *   write array literals indexed like this. Additionally,
     *
     * - the origin of the grid is the top-left corner, with the positive
     *   coordinates extending down and to the right.
     *
     * - why yes, I make extensive use of modifying builtin JavaScript object
     *   prototypes.
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

    /*
     * A comonadic wrapper around grid state.
     *
     * `grid`: the state of the game. It is an array of integers corresponding
     * to the players' pieces. A number n may be interpreted as follows:
     *
     *   - 0 denotes an empty cell
     *   - a number less than 9 denotes a player 0 piece
     *   - a number greater than 9 denotes a player 1 piece
     *
     *  The color is determined by computing (n-1) modulo 8 and using this as
     *  an index into the global `colors` array.
     *
     *  `pos`: stores the coordinate of the current "position of interest,"
     *  which depends on the context.
     *
     *    - When the current player clicks a cell to send their active piece,
     *    `pos` stores the coordinates of that cell.
     *
     *    - When convolving a kernel function (eg, `drawCell`) over the whole
     *    board, `pos` stores the coordinate in focus.
     *
     * `gameId`: nothing fancy here, just the unique id of the game. Used when
     * loading and storing local game state, and also when communicating over
     * the network.
     *
     * `active`: the coordinate of the piece which is currently active (has a
     * dot in the middle).
     *
     * `player`: which player is currently moving?
     *
     * TODO move these last three properties into a single state object.
     *
     */
    function Board(grid, pos, gameId, active, player) {
        this.grid = grid; // the state grid
        this.pos   = pos;

        this.active = typeof active !== 'undefined'
            ? active
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
            active : this.active
        };
        localStorage.setItem(this.gameId,
                JSON.stringify(state));
    };

    // Wrapper of dubious utility. Maybe I'll want to add behavior later?
    Board.prototype.setPos = function(pos) {
        this.pos = pos;
        return this;
    };

    // Modify every cell in the board by applying a given function `f` to it.
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

    // Retrieve the value of the grid at `pos`.
    Board.prototype.extract = function() {
        return this.grid[this.pos.y][this.pos.x];
    };

    /* Takes a board and creates a "board of boards": each cell holds a nearly
     * identical copy of the original board, with each new board's `pos`
     * corresponding to the coordinate of the cell in which it is contained.
     *
     * When used in combination with `map` this gives you the ability to apply
     * 2-d convolutions to the game board.
     */
    Board.prototype.duplicate = function() {
        var me = this, oldGrid = this.grid;
        var x, y, grid = [];
        for (y = 0; y < me.grid.length; y++) {
            grid[y] = [];
            for (x = 0; x < me.grid[y].length; x++) {
                grid[y][x] = new Board(oldGrid, new Pos(x, y),
                                       me.gameId, me.active,
                                       me.player);
            }
        }
        this.grid = grid;
        return this;
    };

    /*
     * Convolution is similar to mapping, except the function being mapped over
     * the board is not simply given the value of each successive cell, but is
     * given an entire board with an updated `pos` corresponding to the
     * position of interest.
     *
     * Read `drawCell` and `drawCells` to see this in action.
     */
    Board.prototype.convolve = Comonad.prototype.convolve;

    // A convolution kernel that draws one cell of a given board.
    function drawCell (board) { return new IO(function() {

        // draw the background color
        var cell = board.extract(); // `pos`
        var cellColor = colors[tileColorPattern[board.pos.y][board.pos.x]];
        context.fillStyle = cellColor;
        context.fillRect(board.pos.x * tileSide, board.pos.y * tileSide,
                                     tileSide,             tileSide);

        if (cell === 0) { return cell; }

        // if there is a piece on this cell, draw it as well
        var x = board.pos.x + 1;
        var y = board.pos.y + 1;
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

        if (board.active !== null         &&
            board.active.x === board.pos.x &&
            board.active.y === board.pos.y) {
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

    // Drawing all the cells drawing a single cell, extended to every cell :)
    Board.prototype.drawCells = function() {
        return this.convolve(drawCell);
    };

    /*
     * Are all the cells on the path between these two cells empty? Assumes
     * they lie on the same column or a diagonal line with slope = 1.
     */
    Board.prototype.emptyPath = function(srcPos, dstPos) {
        var pathIsEmpty = true
          , dX = dstPos.x - srcPos.x
          , dY = dstPos.y - srcPos.y
          , stepX = (dX ? Math.abs(dX)/dX : 0)
          , stepY = Math.abs(dY)/dY
          , y = srcPos.y+stepY, x = srcPos.x+stepX;
        while (y !== dstPos.y && pathIsEmpty) {
            console.log('( '+x+' , '+y+' )');
            if (this.grid[y][x]) {
                pathIsEmpty = false;
            }
            y += stepY;
            x += stepX;
        }
        return pathIsEmpty;
    };

    // Called from clicked(), so this.pos is the position that has been
    // clicked. The piece is starting from this.active
    Board.prototype.legalMove = function() {
        // direction dependent: if the current player is 0, they are going
        // "down" the page, and vice versa for player 1.
        return ((this.player ? this.active.y > this.pos.y
                             : this.active.y < this.pos.y)
            &&  (this.extract() === 0)
            && ((Math.abs(this.active.x - this.pos.x)
            ===  Math.abs(this.active.y - this.pos.y))
            ||  (this.active.x - this.pos.x) === 0))
            && (this.emptyPath(this.active,this.pos));
    };

    // Click event handler.
    Board.prototype.clicked = function(clickPos) {
        var cell = this.setPos(clickPos).extract();

        if (this.active === null) {
            this.active = new Pos(-1, -1);
        }

        // is this cell already active?
        if (this.active.x === this.pos.x &&
            this.active.y === this.pos.y) {
            // do nothing
            this.player = (this.player) ? 0 : 1;
            this.selectNextPiece();
            return this;
        }

        else {
            // not active and the cell contains a piece
            // -> select this new piece
            if (cell > 0) {
                this.active = this.pos;
            }

            // not active and cell does not contain a piece
            // -> move the currently active piece here
            if (cell === 0) {
                if (!this.legalMove()) {
                    return this;
                }
                // else ...
                this.grid[this.pos.y][this.pos.x] =
                    this.grid[this.active.y][this.active.x];
                this.grid[this.active.y][this.active.x] = 0;

                this.active.x = this.pos.x;
                this.active.y = this.pos.y;

                this.player = (this.player) ? 0 : 1 ;
            }
        }

        this.selectNextPiece();
        this.save();
        return this;
    };

    // TODO switch to using a map (we already wrote this loop!)
    Board.prototype.selectNextPiece = function() {
        var x, y, nextCell;
        var activeColor = tileColorPattern[this.active.y][this.active.x];
        var nextPiece = (activeColor + 1) + (this.player * 8);
        for (y = 0; y < this.grid.length; y++) {
            for (x = 0; x < this.grid[y].length; x++) {
                nextCell = this.grid[y][x];
                if (nextCell === nextPiece) {
                    this.active.x = x;
                    this.active.y = y;
                    break;
                }
            }
        }
    };

    // Retrieve the saved board from local storage or create a new one.
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
                                 saved.active, saved.player);
            }
        });
    }

    // Preliminary canvas initialization and viewport configuration.
    setup = new IO(function() {
        context.canvas.width = 0.9*(min(wWidth, wHeight));
        context.canvas.height = context.canvas.width;
        tileSide = ((0.9*min(wWidth, wHeight)) / size);
        radius = (tileSide * 0.9) / 2;
    });

    // Register event handlers.
    function listen(board) {
        return new IO(function() {
            // Register our board click handler
            context.canvas.addEventListener('click', function(evt) {
                var mousePos = getMousePos(this, evt);
                mousePos.x = Math.floor(mousePos.x / tileSide);
                mousePos.y = Math.floor(mousePos.y / tileSide);
                board
                    .clicked(mousePos)
                    .drawCells();
            });
            // Register a handler for the "new game" button.
            document.getElementById('new-game')
                .addEventListener('click', function() {
                location.hash = '';
                location.reload();
            });
        });
    }

    main = setup.
           chain(getBoard).
           chain(function (board) { return IO.of(board.drawCells()); }).
           chain(listen);

    main.start();
})();
