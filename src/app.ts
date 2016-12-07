import { kamisadoApp } from './game';
import { KamisadoAI } from './ai';

const runtime = kamisadoApp.start();

const ai = new KamisadoAI(1);

// tell the game when to resize
window.addEventListener('resize', (evt) => {
    runtime.ports.inbound.resize.send(evt);
}, false);

// for sending to the web sockets
runtime.ports.outbound.moves.recv(board => {
    const nextMove = ai.nextMove(board);
    if (nextMove) {
        runtime.ports.inbound.moves.send(nextMove);
    }
});
