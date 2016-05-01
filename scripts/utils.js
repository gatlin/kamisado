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

function calculateGeometry() {
    const size = 8;
    const boardSide = 0.9*(Math.min(window.innerWidth,window.innerHeight - 50));

    const tileSide = (boardSide / size);
    const radius = (tileSide * 0.9) / 2;

    return {
        size: size,
        boardSide: boardSide,
        tileSide: tileSide,
        radius: radius
    };
}

function setup(runtime) {

    // simple coordinate pair
    function Pos(x, y) {
        this.x = x;
        this.y = y;
    }

    runtime.scope.Pos = Pos;

    let guid = runtime.scope.guid = (function() {
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

    let geom = runtime.scope.geom = calculateGeometry();
    runtime.scope.calculateGeometry = calculateGeometry;

    runtime = initBoard(runtime);
    let Board = runtime.scope.Board;

    runtime.scope.saveGame = function(board) {
        let state = {
            grid     : board.grid,
            player   : board.player,
            gameId   : board.gameId,
            active   : board.active
        };
        window.localStorage.setItem('default',
                JSON.stringify(state));
    };

    let newGame = runtime.scope.newGame = function() {
        let grid = [], y;
        for (y = 1; y < (geom.size-1); y++) {
            grid[y] = [].repeat(0, 8);
        }
        grid[0] = [  1,  2,  3,  4,  5,  6,  7, 8 ];
        grid[7] = [ 16, 15, 14, 13, 12, 11, 10, 9 ];
        return new Board(grid, new Pos(0, 0), 'default');
    };

    runtime.scope.eraseGame = function() {
        window.localStorage.setItem('default',null);
        return newGame();
    };

    runtime.scope.loadGame = function() {

        let saved = JSON.parse(window.localStorage.getItem('default'));
        if (saved === null) {
            return newGame();
        }
        else {
            return new Board(saved.grid, new Pos(0, 0),
                             saved.gameId,
                             saved.active, saved.player);
        }
    };

    /**
     * Window resize event
     */
    let sig = runtime.events['resize'] = Signal.make();
    let sig_id = runtime.addInput(sig);
    runtime.addListener([sig], window, 'resize', function(evt) {
        runtime.notify(sig_id, evt);
    });

    runtime.scope.resizing = false;
    runtime.scope.resizeStart = null;

    return save(runtime);
}
exports.setup = setup;
})(this);
