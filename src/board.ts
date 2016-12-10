/**
 * Board logic
 *
 * Provides logic for manipulating the game board, tracking state, validating
 * moves, and other related utilities.
 */

import { el } from './alm/alm';
import { HasMap } from './alm/base';

export const colors = [
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

export const tileColorPattern = [
    [0, 1, 2, 3, 4, 5, 6, 7],
    [5, 0, 3, 6, 1, 4, 7, 2],
    [6, 3, 0, 5, 2, 7, 4, 1],
    [3, 2, 1, 0, 7, 6, 5, 4],
    [4, 5, 6, 7, 0, 1, 2, 3],
    [1, 4, 7, 2, 5, 0, 3, 6],
    [2, 7, 4, 1, 6, 3, 0, 5],
    [7, 6, 5, 4, 3, 2, 1, 0]
];

type BN = Board<number>; // shorthand
type Context = any; // type kludge

// Helper class
export class Pos {
    public x: number;
    public y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    public equals(that: Pos): boolean {
        return (this.x === that.x &&
            this.y === that.y);
    }

    public becomes(that: Pos) {
        this.x = JSON.parse(JSON.stringify(that.x));
        this.y = JSON.parse(JSON.stringify(that.y));
        return this;
    }

    public clone(): Pos {
        return new Pos(
            JSON.parse(JSON.stringify(this.x)),
            JSON.parse(JSON.stringify(this.y))
        );
    }
}

export type Geom = {
    tileSide: number;
    radius: number;
    boardSide: number;
    pixelRatio: number;
};

export class Board<A> implements HasMap<A> {

    // the actual 8x8 matrix, represented as an array of length 64
    private grid: Array<A>;

    // used for indexing during convolution operations
    public pos: Pos;

    // the position of the active cell
    public active: Pos | null;

    // the player whose turn it is. 0 or 1.
    public player: number;

    // A (possibly) unique ID for this game.
    public gameId: string;

    // the player who has won, or null
    public won: number | null;

    constructor(
        grid: Array<A>,
        pos: Pos,
        gameId: string,
        active: Pos = null,
        player: number = 0
    ) {
        this.grid = grid;
        this.pos = pos;
        this.gameId = gameId;
        this.player = player;
        this.won = null;
        this.active = active;
    }

    static fresh() {
        const grid = [
            9, 10, 11, 12, 13, 14, 15, 16,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            8, 7, 6, 5, 4, 3, 2, 1];
        return new Board(grid, new Pos(0, 0), 'default');
    }

    public getGrid() {
        return JSON.parse(JSON.stringify(this.grid));
    }

    public setPos(pos: Pos): Board<A> {
        this.pos = pos;
        return this;
    }

    // get the value of the grid at `this.pos`
    public extract(): A {
        return this.grid[this.pos.y * 8 + this.pos.x];
    }

    // create a `Board` of `Board`s, with the position of each sub-`Board` being
    // the value of its `pos` property
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

    public map<B>(f: (t: A) => B): Board<B> {
        return new Board(
            this.grid.map(f),
            this.pos,
            this.gameId,
            this.active,
            this.player);
    }

    // This is (and should be) equivalent to
    // `this.duplicate.map(f)`. For efficiency though I'm inlining a bit.
    // That said `#duplicate` and `#map` are provided to test this.
    public convolve<B>(f: (t: Board<A>) => B): Board<B> {
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
            grid.map(f),
            this.pos,
            this.gameId,
            this.active,
            this.player);
    }

    // Determines the next piece based on the color of the cell landed on
    public selectNextPiece(): this {
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

    // Determines whether a path between two positions is empty
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

    // Public way to access grid data at a location
    public gridGet(x: number, y: number): A {
        return this.grid[y * 8 + x];
    }

    // Public way to set grid data at a location
    public gridSet(x: number, y: number, a: A): this {
        this.grid[y * 8 + x] = a;
        return this;
    }
}

// Answers the question of whether the board is in a legal state
function legalMove(board: BN): boolean {
    return ((!board.player
        ? board.active.y > board.pos.y
        : board.active.y < board.pos.y)
        && (board.extract() === 0)
        && ((Math.abs(board.active.x - board.pos.x)
            === Math.abs(board.active.y - board.pos.y))
            || (board.active.x - board.pos.x) === 0))
        && (board.emptyPath(board.active, board.pos));
}

// Convolves `drawCell` over a whole `Board<number>`
export function drawCells(board: BN, context: Context, geom: Geom): BN {
    return board.convolve(drawCell(context, geom));
}

/*
Draws circles with bezier curves.
source:
http://stackoverflow.com/questions/16313198/how-can-i-make-my-html5-canvas-arc-less-pixellated-or-more-anti-aliased
*/
function magic_circle(ctx, x, y, r) {
    const m = 0.551784

    ctx.save()
    ctx.translate(x, y)
    ctx.scale(r, r)

    ctx.beginPath()
    ctx.moveTo(1, 0)
    ctx.bezierCurveTo(1, -m, m, -1, 0, -1)
    ctx.bezierCurveTo(-m, -1, -1, -m, -1, 0)
    ctx.bezierCurveTo(-1, m, -m, 1, 0, 1)
    ctx.bezierCurveTo(m, 1, 1, m, 1, 0)
    ctx.closePath()
    ctx.restore()
}

// Draws the cell on a `Board<number>` at its `#pos` property,
// given a canvas drawing context and a geometry.
function drawCell(context: Context, geom: Geom) {
    return (board: BN): number => {
        let tileSide = geom.tileSide / geom.pixelRatio;
        let radius = geom.radius / geom.pixelRatio;

        // draw the background color
        const cell = board.extract(); // `pos`
        console.log('cell =', cell);
        const cellColor = colors[tileColorPattern[board.pos.y][board.pos.x]];
        context.fillStyle = cellColor;
        const rectStart = [(board.pos.x * tileSide),
        (board.pos.y * tileSide)];
        context.fillRect(rectStart[0], rectStart[1], tileSide, tileSide);

        if (!(cell > 0)) { return cell; }

        // if there is a piece on this cell, draw it as well
        const x = board.pos.x + 1;
        const y = board.pos.y + 1;
        const center = {
            x: ((x) * tileSide) - (tileSide / 2),
            y: ((y) * tileSide) - (tileSide / 2)
        };

        const bezel = (cell > 8) ? colors[9] : colors[8];
        const color = colors[(cell - 1) % 8];

        // bezel
        context.beginPath();
        context.arc(center.x, center.y, radius, 0,
            Math.PI * 2, false);
        context.closePath();
        //magic_circle(context, center.x, center.y, radius);
        context.fillStyle = bezel;
        context.fill();
        context.strokeStyle = bezel;
        context.stroke();

        // piece color
        context.beginPath();
        context.arc(center.x, center.y, radius * 0.75, 0,
            Math.PI * 2, false);
        context.closePath();
        //magic_circle(context, center.x, center.y, radius * 0.75);
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
            magic_circle(context, center.x, center.y, radius * 0.5);
            context.fillStyle = bezel;
            context.fill();
            context.strokeStyle = bezel;
            context.stroke();
        }

        return cell;
    };
}

// returns a boolean stating if the move was successful
export function movePiece(board: BN, pos: Pos): boolean {

    let cell = board.setPos(pos).extract();

    if ((board.player && cell < 8 && cell > 0) ||
        (!board.player && cell > 8)) {
        return false;
    }

    if (board.active === null) {
        board.active = pos.clone();
        return true;
    }

    // if we clicked ourselves, swap over
    // note: this is really only for cases where a piece is blocked
    // I should ensure that the piece is, in fact, blocked
    if (board.active.equals(board.pos)) {
        // do nothing
        board.player = (board.player) ? 0 : 1;
        board = board.selectNextPiece();
        return false;
    }

    else {

        // not active and cell does not contain a piece
        // -> move the currently active piece here
        if (cell === 0) {
            if (!legalMove(board)) {
                return false;
            }

            /*** LEAVE ALL THIS */
            board = board.gridSet(board.pos.x, board.pos.y, board.gridGet(
                board.active.x, board.active.y));
            board = board.gridSet(board.active.x, board.active.y, 0);

            board.active.becomes(board.pos);
            // has somebody won?
            if ((!board.player && (board.pos.y === 0))
                || (board.player && (board.pos.y === 7))) {
                board.won = board.pos.y ? 1 : 0;
                return true;
            }

            board.player = (board.player) ? 0 : 1;
            /*** END */
        } else {
            return false;
        }
    }
    board = board.selectNextPiece();
    return true;
}
