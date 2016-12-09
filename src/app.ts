import { kamisadoApp } from './game';
import { KamisadoAI } from './ai';

const runtime = kamisadoApp.start();

const ai = new KamisadoAI(1);

// tell the game when to resize
window.addEventListener('resize', (evt) => {
    runtime.ports.inbound.resize.send(evt);
}, false);

// for game <-> AI interaction
runtime.ports.outbound.moves.recv(board => {
    const nextMove = ai.nextMove(board);
    if (nextMove) {
        window.setTimeout(() => {
            runtime.ports.inbound.moves.send(nextMove);
        }, 2000);
    }
});
