import { el, App } from './alm/alm';
import { Board, Pos, Geom } from './board';

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

type GameState = {
    board: Board<number>;
    geom: Geom;
    context: any; // eh ...
};

function new_game(geom: Geom): Board<number> {
    let grid = [
        1, 2, 3, 4, 5, 6, 7, 8,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        16, 15, 14, 13, 12, 11, 10, 9];
    return new Board(grid, new Pos(0, 0), 'default', geom);
};

function new_state(): GameState {
    const geom: Geom = calculate_geometry();
    return {
        board: new_game(geom),
        geom: geom,
        context: null
    };
}

const app = new App<GameState>({
    state: new_state(),
    update: (action, state) => state,
    main: scope => { },
    render: state => el('h1', {}, ['cool']),
    eventRoot: 'app',
    domRoot: 'app',
    extraEvents: ['resize']
}).start();
