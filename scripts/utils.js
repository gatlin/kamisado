(function(exports) {
'use strict';

/**
 * Utils module
 *
 * Utilities which cluttered up the application or game logic.
 *
 * It computes window measurements and useful game constants; exposes functions
 * to save, load, and erase a game using localStorage; and initializes the
 * Board module.
 *
 * Exports:
 *
 *   - a convenience method for Arrays
 *   - a function to setup the game runtime
 */

exports.Array.prototype.repeat = function(what, L) {
    while (L) {
        this[--L] = what;
    }
    return this;
};

function setup(runtime) {

    // simple coordinate pair
    function Pos(x, y) {
        this.x = x;
        this.y = y;
    }

    runtime.utils.Pos = Pos;

    let min = runtime.utils.min = (a,b) => (a < b) ? a : b;

    let guid = runtime.utils.guid = (function() {
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

    const size = runtime.utils.size = 8;
    const ratio = runtime.utils.boardWidth = runtime.utils.boardHeight =
        0.9*(min(window.innerWidth,window.innerHeight - 50));

    const tileSide = runtime.utils.tileSide = (ratio / size);
    const radius = runtime.utils.radius = (tileSide * 0.9) / 2;

    runtime = initBoard(runtime);
    let Board = runtime.utils.Board;

    runtime.utils.saveGame = function(board) {
        let state = {
            grid     : board.grid,
            player   : board.player,
            gameId   : board.gameId,
            active   : board.active
        };
        window.localStorage.setItem('default',
                JSON.stringify(state));
    };

    let newGame = runtime.utils.newGame = function() {
        let grid = [], y;
        for (y = 1; y < (size-1); y++) {
            grid[y] = [].repeat(0, 8);
        }
        grid[0] = [  1,  2,  3,  4,  5,  6,  7, 8 ];
        grid[7] = [ 16, 15, 14, 13, 12, 11, 10, 9 ];
        return new Board(grid, new Pos(0, 0), 'default');
    };

    runtime.utils.eraseGame = function() {
        window.localStorage.setItem('default',null);
        return newGame();
    };

    runtime.utils.loadGame = function() {

        let saved = JSON.parse(window.localStorage.getItem('default'));
        console.log(saved);
        if (saved === null) {
            return newGame();
        }
        else {
            return new Board(saved.grid, new Pos(0, 0),
                             saved.gameId,
                             saved.active, saved.player);
        }
    };

    return save(runtime);
}
exports.setup = setup;
})(this);
