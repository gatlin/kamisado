import { Board, Pos, colors, tileColorPattern } from './board';

type Pair<A, B> = [A, B];

export class KamisadoAI {
    private whoAmI: number; // 0 or 1

    constructor(whoAmI) {
        this.whoAmI = whoAmI;
    }

    private getMoves(board: Board<number>, whereAmI: Pos, player, ignore =
        null): Array<Pos> {
        let results: Array<Pos> = [];
        const stepY = player ? 1 : -1;
        const winY = player ? 7 : 0;

        for (let stepX of [1, 0, -1]) {
            let dY = stepY, dX = stepX, pos;
            let done = false;
            while (!done) {
                pos = whereAmI.clone();
                pos.x += dX;
                pos.y += dY;
                const ignorePos = (ignore !== null && pos.equals(ignore));
                if (pos.y > 7 || pos.y < 0 ||
                    pos.x > 7 || pos.x < 0 ||
                    (board.gridGet(pos.x, pos.y) &&
                        !ignorePos)) {
                    done = true;
                } else {
                    results.push(pos);
                    dY += stepY;
                    dX += stepX;
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
        const winY = this.whoAmI ? 7 : 0;
        const loseY = this.whoAmI ? 0 : 7;
        const myMoves = this.getMoves(board, board.active, this.whoAmI, null);
        console.log('myMoves length', myMoves.length);

        // build a set of opponent pieces using colors and store the positions
        // also if any moves straight allow me to win, shortcircuit
        // also keep track of which opponent piece has the fewest options
        // and thwart the ones with few options where one option is a winner
        const opponent_pieces = {};
        const opponent_moves = {};
        let lowest_score = 10000;
        let lowest_scoring_piece = null;
        if (myMoves.length === 0) {
            return board.active;
        }
        for (let move of myMoves) {
            if (move.y === winY) {
                return move;
            }
            const color = tileColorPattern[move.y][move.x];
            const piece = (color + 1) + (otherPlayer * 8);

            // find the location of the piece

            if (!(piece in opponent_pieces)) {
                opponent_pieces[piece] = [move];
            } else {
                opponent_pieces[piece].push(move);
            }

            // avoid recomputation
            if (piece in opponent_moves) {
                continue;
            }

            const piece_pos = this.findPiece(board, piece);
            const piece_moves = this.getMoves(board, piece_pos, otherPlayer,
                board.active);

            opponent_moves[piece] = piece_moves;

            let penalty = 0;
            // if the piece can win, exclude it
            for (let piece_move of piece_moves) {
                if (piece_move.y === loseY) {
                    console.log('piece ' + piece + ' can win');
                    penalty += 25;
                }
            }
            const score = penalty + piece_moves.length;
            console.log('piece ' + piece + ' score: ' + score);
            if (score < lowest_score) {
                lowest_score = score;
                lowest_scoring_piece = piece;
            }
        }

        console.log('lowest scoring piece', lowest_scoring_piece);
        console.log('lowest score', lowest_score);

        const max = opponent_pieces[lowest_scoring_piece].length;
        return opponent_pieces[lowest_scoring_piece][
            Math.floor(
                Math.random() * max
            )
        ];
    }
}
