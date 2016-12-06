import { kamisadoApp } from './game';

const runtime = kamisadoApp.start();

window.addEventListener('resize', (evt) => {
    runtime.ports.resize_event.send(evt);
}, false);
