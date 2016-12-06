import { kamisadoApp } from './game';

const runtime = kamisadoApp.start();

// tell the game when to resize
window.addEventListener('resize', (evt) => {
    runtime.ports.inbound.resize.send(evt);
}, false);

// for sending to the web sockets
runtime.ports.outbound.moves.recv(move => {
});
