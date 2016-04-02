(function(exports) {
'use strict';

/**
 * Board module
 *
 * Encodes the rules about moving pieces around the board and draws the state
 * of the board onto a canvas context supplied by the application.
 *
 * The exported function, initBoard, accepts the application runtime which
 * contains pre-computed constants used for drawing. It returns a modified
 * runtime containing the Board class.
 */

function initBoard(runtime) {

    let Pos = runtime.utils.Pos;

    const colors = [
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

    const tileColorPattern = [
        [0,1,2,3,4,5,6,7],
        [5,0,3,6,1,4,7,2],
        [6,3,0,5,2,7,4,1],
        [3,2,1,0,7,6,5,4],
        [4,5,6,7,0,1,2,3],
        [1,4,7,2,5,0,3,6],
        [2,7,4,1,6,3,0,5],
        [7,6,5,4,3,2,1,0]
    ];

    function Board(grid, pos, gameId, active, player) {
        this.grid = grid;
        this.pos  = pos;

        // A tile is active if it has a piece on it
        this.active = typeof active !== 'undefined'
            ? active
            : null;

        this.player = typeof player !== 'undefined'
            ? player
            : 0;

        // If I ever implement networked play, this will be more useful
        this.gameId = typeof gameId !== 'undefined'
            ? gameId
            : 'test-game';

        // either a player number or null
        this.won = null;
    }

    // Exporting the Board class after definition by convention.
    runtime.utils.Board = Board;

    Board.prototype.setPos = function(pos) {
        this.pos = pos;
        return this;
    };

    // Perform a function on every tile in the grid.
    Board.prototype.map = function(f) {
        let x, y, grid = [];

        for (y = 0; y < this.grid.length; y++) {
            grid[y] = [];
            for (x = 0; x < this.grid[y].length; x++) {
                grid[y][x] = f(this.grid[y][x]);
            }
        }
        this.grid = grid;
        return this;
    };

    // Extract the value of the currently focused grid position.
    Board.prototype.extract = function() {
        return this.grid[this.pos.y][this.pos.x];
    };

    /**
     * Transform a board with a certain grid state and position into a Board
     * where each tile in the grid is a clone of the original Board, except
     * with its `pos` property changed to its position in the grid.
     *
     * From `duplicate` and `map` we can automatically derive `convolve` which
     * I use down in `drawCells`. There are many ways to skin this particular
     * cat but I like the elegance of this technique and it's fast enough.
     *
     * FIXME optimization: use laziness and memoization to avoid unnecessary
     * work here.
     */
    Board.prototype.duplicate = function() {
        let oldGrid = this.grid;
        let x, y, grid = [];
        for (y = 0; y < this.grid.length; y++) {
            grid[y] = [];
            for (x = 0; x < this.grid[y].length; x++) {
                grid[y][x] = new Board(oldGrid, new Pos(x, y),
                                       this.gameId, this.active,
                                       this.player);
            }
        }
        this.grid = grid;
        return this;
    };

    instance(Board,Comonad);

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

    // Click event handler.
    Board.prototype.clicked = function(clickPos) {
        let cell = this.setPos(clickPos).extract();

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

                // has somebody won?
                if ((!this.player && (this.pos.y === 7))
                 || ( this.player && (this.pos.y === 0))) {
                    this.won = this.pos.y ? 1 : 0;
                }

                this.player = (this.player) ? 0 : 1 ;
            }
        }

        this.selectNextPiece();
        return this;
    };

    Board.prototype.emptyPath = function(srcPos, dstPos) {
        let pathIsEmpty = true
          , dX = dstPos.x - srcPos.x
          , dY = dstPos.y - srcPos.y
          , stepX = (dX ? Math.abs(dX)/dX : 0)
          , stepY = Math.abs(dY)/dY
          , y = srcPos.y+stepY, x = srcPos.x+stepX;
        while (y !== dstPos.y && pathIsEmpty) {
            if (this.grid[y][x]) {
                pathIsEmpty = false;
            }
            y += stepY;
            x += stepX;
        }
        return pathIsEmpty;
    };

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

    /**
     * Draws a board's current position on the board.
     *
     * Since Board is a comonad, drawing all cells is done by convolving this
     * function over every position.
     */
    let drawCell = runtime.utils.drawCell = function(context) {
        return function(board) {
        let tileSide = runtime.utils.geom.tileSide;
        let size = runtime.utils.geom.size;
        let radius = runtime.utils.geom.radius;

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
    }; };

    Board.prototype.drawCells = function(ctx) {
        return this.convolve(drawCell(ctx));
    };

    return runtime;
};

exports.initBoard = initBoard;
})(this);
