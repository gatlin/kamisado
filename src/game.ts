import { el, App, Mailbox } from './alm/alm';
import { Board, Pos, Geom, boardClicked } from './board';

type HTMLElement = any | null; // yet another type kludge
// will be subscribed to updates to the canvas DOM node
const canvasMBox = new Mailbox<HTMLElement>(null);

// Actions sent through the app
enum Actions {
    ResizeStart,
    CanvasUpdate,
    Click,
    Reset
};

// calculates size of the board and the tiles based on the window
function calculate_geometry(): Geom {
    const size = 8;
    const boardSide = 0.9 * (
        Math.min(window.innerWidth, window.innerHeight - 50));
    const tileSide = (boardSide / size);
    const radius = (tileSide * 0.9) / 2;

    return {
        size: size,
        boardSide: boardSide,
        tileSide: tileSide,
        radius: radius
    };
}

// the state of our app
type GameState = {
    board: Board<number>;
    geom: Geom;
    context: any; // eh ...
    resizeStart: number;
    resizing: boolean;
};

// n > 0 => a game piece
// n > 0 && < 9 => player 0
// else => player 1
function new_game(): Board<number> {
    let grid = [
        1, 2, 3, 4, 5, 6, 7, 8,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        16, 15, 14, 13, 12, 11, 10, 9];
    return new Board(grid, new Pos(0, 0), 'default');
};

function erase_game(): Board<number> {
    window.localStorage.setItem('default', null);
    return new_game();
}

// load a game from local storage
function load_game(): Board<number> {
    const saved = window.localStorage.getItem('default');
    if (!saved) {
        return new_game();
    } else {
        const parsed = JSON.parse(saved);
        return new Board<number>(
            parsed.grid,
            new Pos(0, 0),
            parsed.gameId,
            parsed.active,
            parsed.player);
    }
}

// save a game to local storage
function save_game(board) {
    const state = {
        grid: board.getGrid(),
        player: board.player,
        gameId: board.gameId,
        active: board.active
    }

    window.localStorage.setItem('default',
        JSON.stringify(state));
}

// creates an initial game state with drawing geometry and a (possibly loaded
// from storage) board.
function new_state(): GameState {
    return {
        board: load_game(),
        geom: calculate_geometry(),
        context: null,

        // these two deal with detecting window resizes so the canvas can be
        // redrawn
        resizing: false,
        resizeStart: -1
    };
}

// The state reducer.
function update(action, state) {
    if (action['type'] === Actions.ResizeStart) {
        // a browser "resize" event came our way
        const evt = action.data.evt;
        state.resizeStart = Date.now();

        // use timers to delay redrawing until no new resize events have fired
        // in a while
        const resizeFinish = () => {
            if (Date.now() - state.resizeStart < 200) {
                window.setTimeout(resizeFinish, 200);
            } else {
                state.resizing = false;
                state.board.drawCells(state.context, state.geom);
            }
        };

        if (state.resizing === false) {
            state.resizing = true;
            state.geom = calculate_geometry();
            window.setTimeout(resizeFinish, 200);
        }
    }

    // If we have a canvas update that isn't null, get its new context
    if (action['type'] === Actions.CanvasUpdate && action.data !== null) {
        const canvasEl = action.data;
        state.context = canvasEl.getContext('2d');
    }

    // the user clicked somewhere on the board
    if (action['type'] === Actions.Click) {
        const raw = action.data;
        let rect = raw
            .target
            .getBoundingClientRect();
        let xCoord = raw.clientX - rect.left;
        let yCoord = raw.clientY - rect.top;

        const pos = new Pos(Math.floor(xCoord / state.geom.tileSide),
            Math.floor(yCoord / state.geom.tileSide));

        state.board = boardClicked(state.board, pos);
        if (state.board.won !== null) {
            state.board = erase_game();
        }
        save_game(state.board);
    }

    if (action['type'] === Actions.Reset) {
        state.board = erase_game();
        save_game(state.board);
    }

    // also if we have a drawing context redraw the state of the board
    if (state.context) {
        state.board.drawCells(state.context, state.geom);
    }

    return state;
}

// signal routing
function main(scope) {
    scope.ports.resize_event
        .recv(evt => {
            scope.actions.send({
                'type': Actions.ResizeStart,
                data: {
                    evt: evt,
                    updates: scope.actions
                }
            });
        });

    scope.events.click
        .filter(evt => evt.getId() === 'board_canvas')
        .recv(evt => {
            scope.actions.send({
                'type': Actions.Click,
                'data': evt.getRaw()
            });
        });

    canvasMBox
        .recv(cnvs => {
            scope.actions.send({
                'type': Actions.CanvasUpdate,
                'data': cnvs
            });
        });

    scope.events.click
        .filter(evt => evt.getId() === 'reset-btn')
        .recv(evt => { scope.actions.send({ 'type': Actions.Reset }); });
}

// state -> virtual DOM tree
function render(state) {
    return el('div', { 'class': 'container', 'id': 'board' }, [
        el('canvas', {
            'id': 'board_canvas',
            'width': state.geom.boardSide,
            'height': state.geom.boardSide
        }, []).subscribe(canvasMBox),
        el('footer', { 'class': 'footer' }, [
            el('div', { 'class': 'container' }, [
                el('button', { 'id': 'reset-btn' }, [
                    "Reset game"
                ]),
                el('p', {}, [
                    el('a', {
                        'href': 'https://github.com/gatlin/kamisado/blob/master/README.md'
                    }, ["How to play and more info available here."]),
                    " Made with ",
                    el('a', { 'href': 'http://niltag.net/Alm' },
                        ["Alm"]),
                    ". ",
                    el('a', { 'href': 'https://github.com/gatlin/Kamisado' },
                        ["Source code on GitHub."])
                ])
            ])
        ])
    ]);
}

// we export the app but don't start it yet. Modularity! Wow!
export const kamisadoApp = new App<GameState>({
    state: new_state(),
    update: update,
    main: main,
    render: render,
    eventRoot: 'app',
    domRoot: 'app',
    ports: ['resize_event']
});
