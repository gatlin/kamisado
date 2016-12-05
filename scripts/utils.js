(function(exports) {
'use strict';

/**
 * Utils module
 *
 * Utilities which are not strictly part of the game logic nor part of the event
 * routing logic.
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

    // a simple guid that's more sophisticated than monotonically increasing
    // integers
    let guid = (function() {
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


    const geom = calculateGeometry();

    const board = initBoard({
        Pos: Pos,
        geom: geom
    });
    let Board = board.Board;

    let saveGame = function(board) {
        let state = {
            grid     : board.grid,
            player   : board.player,
            gameId   : board.gameId,
            active   : board.active
        };
        window.localStorage.setItem('default',
                JSON.stringify(state));
    };

    let newGame = function() {
        let grid = [], y;
        for (y = 1; y < (geom.size-1); y++) {
            grid[y] = [].repeat(0, 8);
        }
        grid[0] = [  1,  2,  3,  4,  5,  6,  7, 8 ];
        grid[7] = [ 16, 15, 14, 13, 12, 11, 10, 9 ];
        return new Board(grid, new Pos(0, 0), 'default');
    };

    let eraseGame = function() {
        window.localStorage.setItem('default',null);
        return newGame();
    };

    let loadGame = function() {

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

    runtime.scope.Board = Board;
    runtime.scope.Pos = Pos;
    runtime.scope.geom = geom;
    runtime.scope.calculateGeometry = calculateGeometry;
    runtime.scope.newGame = newGame;
    runtime.scope.saveGame = saveGame;
    runtime.scope.eraseGame = eraseGame;
    runtime.scope.loadGame = loadGame;
    runtime.scope.resizing = false;
    runtime.scope.resizeStart = null;
    runtime.scope.guid = guid;

    return runtime;
}
exports.setup = setup;
})(this);
