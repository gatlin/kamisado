import { el, App, Mailbox } from './alm/alm';
import { Board, Pos, Geom, movePiece, drawCells } from './board';

type HTMLElement = any | null; // yet another type kludge
// will be subscribed to updates to the canvas DOM node
const canvasMBox = new Mailbox<HTMLElement>(null);

// Actions sent through the app
enum Actions {
    ResizeStart,
    CanvasUpdate,
    UserMove,
    Reset,
    RemoteMove
};

// calculates size of the board and the tiles based on the window
function calculate_geometry(): Geom {
    const winSize = Math.min(window.innerWidth,
        window.innerHeight - 50);
    let boardSide;
    if (winSize >= 480) {
        boardSide = 0.75 * winSize;
    } else {
        boardSide = 0.95 * winSize;
    }
    if (boardSide < 480) {
        boardSide = window.innerWidth;
    }
    const tileSide = (boardSide / 8);
    const radius = (tileSide * 0.9) / 2;

    return {
        boardSide: boardSide,
        tileSide: tileSide,
        radius: radius
    };
}

type Move = {
    src: Pos;
    dst: Pos;
};

// the state of our app
type GameState = {
    board: Board<number>;
    geom: Geom;
    context: any; // eh ...
    resizeStart: number;
    resizing: boolean;
    move_number: number;
    last_move: Move;
    current_player: number; // 0 or 1
    i_am: number; // 0 or 1, AI player number
};

// n > 0 => a game piece
// n > 0 && < 9 => player 0
// else => player 1
function new_game(): Board<number> {
    return Board.fresh();
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
        if (parsed) {
            return new Board<number>(
                parsed.grid,
                new Pos(0, 0),
                parsed.gameId,
                (parsed.active !== null
                    ? new Pos(parsed.active.x, parsed.active.y)
                    : null),
                parsed.player);
        } else {
            erase_game();
        }
    }
}

// save a game to local storage
function save_game(board) {
    const active = board.active !== null
        ? { x: board.active.x, y: board.active.y }
        : null;
    const state = {
        grid: board.getGrid(),
        player: board.player,
        gameId: board.gameId,
        active: active
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
        resizeStart: -1,
        move_number: 0,
        last_move: null,
        current_player: 0,
        i_am: 1
    };
}

// turn remote coordinates around
function flipPos(pos: Pos): Pos {
    pos.x = Math.abs(pos.x - 7);
    pos.y = Math.abs(pos.y - 7);
    return pos;
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
                state.board = drawCells(state.board, state.context, state.geom);
                //                state.board.drawCells(state.context, state.geom);
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
    if (action['type'] === Actions.UserMove) {
        const raw = action.data;
        let rect = raw
            .target
            .getBoundingClientRect();
        let xCoord = raw.clientX - rect.left;
        let yCoord = raw.clientY - rect.top;

        const src = state.board.active !== null
            ? state.board.active.clone()
            : null;
        const pos = new Pos(Math.floor(xCoord / state.geom.tileSide),
            Math.floor(yCoord / state.geom.tileSide));
        const dst = pos.clone();
        const success = movePiece(state.board, pos);

        if (success || src.equals(dst)) {
            state.move_number = state.move_number + 1;
            state.current_player = (state.current_player + 1) % 2;
            state.last_move = {
                src: src,
                dst: dst
            };
            if (state.board.won !== null) {
                state.board = erase_game();
            }
        }
        save_game(state.board);
    }

    if (action['type'] === Actions.RemoteMove) {
        const success = movePiece(state.board, action.data.clone());
        if (success) {
            state.current_player = (state.current_player + 1) % 2;
            if (state.board.won !== null) {
                //   state.board = erase_game();
            }
        }
        save_game(state.board);
    }

    if (action['type'] === Actions.Reset) {
        state.board = erase_game();
        save_game(state.board);
    }

    // also if we have a drawing context redraw the state of the board
    if (state.context) {
        state.board = drawCells(state.board, state.context, state.geom);
    }

    return state;
}

// signal routing
function main(scope) {
    scope.ports.inbound.resize
        .recv(evt => {
            scope.actions.send({
                'type': Actions.ResizeStart,
                data: {
                    evt: evt,
                    updates: scope.actions
                }
            });
        });

    scope.ports.inbound.moves
        .recv(move => {
            scope.actions.send({
                'type': Actions.RemoteMove,
                data: move
            });
        });

    scope.events.click
        .filter(evt => evt.getId() === 'board_canvas')
        .recv(evt => {
            const raw = evt.getRaw();
            scope.actions.send({
                'type': Actions.UserMove,
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

    scope.state
        .reduce(0, (state, move_number) => {
            if (state.move_number > move_number) {
                scope.ports.outbound.moves.send(state.board);
            }
            return state.move_number;
        });
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
    eventRoot: 'kamisado-game',
    domRoot: 'kamisado-game',
    ports: {
        inbound: ['resize', 'moves'],
        outbound: ['moves']
    }
});
