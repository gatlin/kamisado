import { el } from './alm/alm';

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
    [0, 1, 2, 3, 4, 5, 6, 7],
    [5, 0, 3, 6, 1, 4, 7, 2],
    [6, 3, 0, 5, 2, 7, 4, 1],
    [3, 2, 1, 0, 7, 6, 5, 4],
    [4, 5, 6, 7, 0, 1, 2, 3],
    [1, 4, 7, 2, 5, 0, 3, 6],
    [2, 7, 4, 1, 6, 3, 0, 5],
    [7, 6, 5, 4, 3, 2, 1, 0]
];

export class Pos {
    public x: number;
    public y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

export type Geom = {
    tileSide: number;
    radius: number;
    size: number;
    boardSide: number;
};

export class Board<A> {
    private grid: Array<A>;

    public pos: Pos;
    public active: Pos;
    public player: number;
    public gameId: string;

    public won: number;

    constructor(
        grid: Array<A>,
        pos: Pos,
        gameId: string,
        active: Pos = null,
        player: number = 0,
    ) {
        this.grid = grid;
        this.pos = pos;
        this.gameId = gameId;
        this.player = player;
        this.won = null;
        this.active = active;
    }

    public getGrid() {
        return this.grid;
    }

    public setPos(pos: Pos): Board<A> {
        this.pos = pos;
        return this;
    }

    public extract(): A {
        return this.grid[this.pos.y * 8 + this.pos.x];
    }

    public duplicate(): Board<Board<A>> {
        let oldGrid = this.grid;
        let x, y, grid = new Array(64);
        for (y = 0; y < 8; y++) {
            for (x = 0; x < 8; x++) {
                grid[y * 8 + x] = new Board(
                    oldGrid,
                    new Pos(x, y),
                    this.gameId,
                    this.active,
                    this.player);
            }
        }
        return new Board(
            grid,
            this.pos,
            this.gameId,
            this.active,
            this.player);
    }

    public map(f) {
        let x, y, grid = [];
        for (y = 0; y < 8; y++) {
            for (x = 0; x < 8; x++) {
                grid[y * 8 + x] = f(this.grid[y * 8 + x]);
            }
        }
        return this;
    }

    public convolve(f) {
        return this.duplicate().map(f);
    }

    public selectNextPiece() {
        let x, y, nextCell;
        let activeColor = tileColorPattern[this.active.y][this.active.x];
        let nextPiece = (activeColor + 1) + (this.player * 8);
        for (y = 0; y < 8; y++) {
            for (x = 0; x < 8; x++) {
                nextCell = this.grid[y * 8 + x];
                if (nextCell === nextPiece) {
                    this.active.x = x;
                    this.active.y = y;
                    break;
                }
            }
        }

        return this;
    }

    public emptyPath(srcPos: Pos, dstPos: Pos): boolean {
        const dX = dstPos.x - srcPos.x
            , dY = dstPos.y - srcPos.y
            , stepX = (dX ? Math.abs(dX) / dX : 0)
            , stepY = Math.abs(dY) / dY;
        let pathIsEmpty = true
            , x = srcPos.x + stepX
            , y = srcPos.y + stepY;

        while (y !== dstPos.y && pathIsEmpty) {
            if (this.grid[y * 8 + x]) {
                pathIsEmpty = false;
            }

            y += stepY;
            x += stepX;
        }
        return pathIsEmpty;
    }

    public drawCells(context, geom) {
        this.convolve(drawCell(context, geom));
    }

    public gridGet(x: number, y: number): A {
        return this.grid[y * 8 + x];
    }

    public gridSet(x: number, y: number, a: A): this {
        this.grid[y * 8 + x] = a;
        return this;
    }
}

function legalMove(board: Board<number>): boolean {
    return ((board.player
        ? board.active.y > board.pos.y
        : board.active.y < board.pos.y)
        && (board.extract() === 0)
        && ((Math.abs(board.active.x - board.pos.x)
            === Math.abs(board.active.y - board.pos.y))
            || (board.active.x - board.pos.x) === 0))
        && (board.emptyPath(board.active, board.pos));
}

function drawCell(context, geom) {
    return (board: Board<number>) => {
        let tileSide = geom.tileSide;
        let size = geom.size;
        let radius = geom.radius;

        // draw the background color
        var cell = board.extract(); // `pos`
        var cellColor = colors[tileColorPattern[board.pos.y][board.pos.x]];
        context.fillStyle = cellColor;
        context.fillRect(board.pos.x * tileSide, board.pos.y * tileSide,
            tileSide, tileSide);

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
            Math.PI * 2, false);
        context.closePath();
        context.fillStyle = bezel;
        context.fill();
        context.strokeStyle = bezel;
        context.stroke();

        // piece color
        context.beginPath();
        context.arc(center.x, center.y, radius * 0.75, 0,
            Math.PI * 2, false);
        context.closePath();
        context.fillStyle = color;
        context.fill();
        context.strokeStyle = color;
        context.stroke();

        if (board.active !== null &&
            board.active.x === board.pos.x &&
            board.active.y === board.pos.y) {
            context.beginPath();
            context.arc(center.x, center.y, radius * 0.5, 0,
                Math.PI * 2, false);
            context.fillStyle = bezel;
            context.fill();
            context.strokeStyle = bezel;
            context.stroke();
        }

        return cell;
    };
}

export function boardClicked(board: Board<number>, clickPos: Pos): Board<number> {

    let cell = board.setPos(clickPos).extract();

    if (board.active === null) {
        board.active = new Pos(-1, -1);
    }

    // is this cell already active?
    if (board.active.x === board.pos.x &&
        board.active.y === board.pos.y) {
        // do nothing
        board.player = (board.player) ? 0 : 1;
        return board.selectNextPiece();
    }

    else {
        // not active and the cell contains a piece
        // -> select this new piece
        if (cell > 0) {
            board.active.x = board.pos.x;
            board.active.y = board.pos.y;
        }

        // not active and cell does not contain a piece
        // -> move the currently active piece here
        if (cell === 0) {
            if (!legalMove(board)) {
                return board;
            }
            // else ...
            board = board.gridSet(board.pos.x, board.pos.y, board.gridGet(
                board.active.x, board.active.y));
            board = board.gridSet(board.active.x, board.active.y, 0);

            board.active = board.pos;
            // has somebody won?
            if ((!board.player && (board.pos.y === 7))
                || (board.player && (board.pos.y === 0))) {
                board.won = board.pos.y ? 1 : 0;
                console.log('WINNER');
                return board;
            }

            board.player = (board.player) ? 0 : 1;
        }
    }
    return board.selectNextPiece();
}