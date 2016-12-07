import { Board, Pos, colors, tileColorPattern } from './board';

export class KamisadoAI {
    private whoAmI: number; // 0 or 1

    constructor(whoAmI) {
        this.whoAmI = whoAmI;
    }

    private getMoves(board: Board<number>, whereAmI: Pos): Array<Pos> {
        let results: Array<Pos> = [];
        const dY = board.player ? 1 : -1;
        const winY = board.player ? 7 : 0;
        for (let dX = -1; dX < 2; dX++) {
            const pos = whereAmI.clone();
            let done = false;
            while (!done) {
                // if you can win just do that
                if (pos.y === winY && !board.gridGet(pos.x, pos.y)) {
                    return [pos];
                }
                pos.x = pos.x + dX;
                pos.y = pos.y + dY;
                if ((pos.y < 8 && pos.y >= 0 &&
                    pos.x < 8 && pos.x >= 0) &&
                    !board.gridGet(pos.x, pos.y)) {
                    results.push(pos.clone());
                } else {
                    done = true;
                }
            }
        }
        return results;
    }

    private findPiece(board: Board<number>, piece: number): Pos | null {
        let x, y, nextCell;
        for (y = 0; y < 8; y++) {
            for (x = 0; x < 8; x++) {
                nextCell = board.gridGet(x, y);
                if (nextCell === piece) {
                    return new Pos(x, y);
                }
            }
        }

        return null;
    }

    // rudimentary algorithm:
    // for all our possible moves,
    // for all of their resulting possible moves,
    // pick the move which gives them the fewest options while not
    // exposing a vulnerability (if possible)
    public nextMove(board: Board<number>): Pos | null {
        if (board.player !== this.whoAmI) {
            return null;
        }

        const otherPlayer = (this.whoAmI + 1) % 2;
        const myMoves = this.getMoves(board, board.active)

        // create an index of their piece => positions which lead to it
        const moveIndex = myMoves
            .reduce((mI, pos) => {
                const color = tileColorPattern[pos.y][pos.x];
                const theirPiece = (color + 1) + (otherPlayer * 8);
                if (!(theirPiece in mI)) {
                    mI[theirPiece] = [pos];
                } else {
                    mI[theirPiece].push(pos);
                }
                return mI;
            }, {});
        console.log('moveIndex', moveIndex);
        let lowest_option_num = 100;
        let result = null;

        // finally, get the number of options for each of their possible pieces
        // and return a position which leaves the opponent with the fewest
        // possibilities

        for (let pieceS in moveIndex) {
            const piece = parseInt(pieceS);
            const pos = this.findPiece(board, piece);
            const pieceMovesNum = this.getMoves(board, pos).length;
            if (pieceMovesNum < lowest_option_num) {
                lowest_option_num = pieceMovesNum;
                const idx = Math.floor(Math.random() * moveIndex[piece].length);
                console.log('idx =', idx);
                result = moveIndex[piece][idx];
            }
        }
        console.log('result', result);
        return (result ? result : board.active);
    }
}
