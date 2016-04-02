(function() {
'use strict';

var app = App.init()

/* `setup` is found in `scripts/utils.js`. */
.runtime(setup)

/* High level application logic */
.main(function(alm) {
    let el = alm.el
      , events = alm.events
      , utils = alm.utils
      , Pos = utils.Pos
      , Board = utils.Board
      ;

    let canvas = alm.mailbox(null);
    let updates = alm.mailbox(null);

    /**
     * When a mouse click occurs inside the canvas, compute the tile clicked
     * (based on pre-computed window measurements) and send the position to the
     * updates mailbox.
     */
    events.mouse.click
        .filter((evt) => evt.target.id === 'board_canvas')
        .map(function(evt) {
            let rect = evt.target.getBoundingClientRect();
            let xCoord = evt.clientX - rect.left;
            let yCoord = evt.clientY - rect.top;
            return new Pos(Math.floor(xCoord / utils.tileSide),
                           Math.floor(yCoord / utils.tileSide));
        })
        .recv((pos) => updates.send({ type: 'position', data: pos }));

    /**
     * When the reset button is clicked, erase the game (which will trigger a
     * window refresh.
     */
    events.mouse.click
        .filter((evt) => evt.target.id === 'reset-btn')
        .recv((evt) => updates.send({ type: 'reset', data: null }));

    // The initial game state
    let initial_model = {
        board: utils.loadGame(), // board state
        context: null            // display canvas
    };

    /**
     * Listen for update events. Two flavors: position updates, and canvas
     * updates.
     *
     * Position updates are when a player selects a tile to move their piece
     * to; the payload is, unsurprisingly, the coordinate.
     *
     * Canvas updates occur when the dom re-renders the canvas (hopefully
     * infrequently). When this happens the canvas drawing context is updated
     * in the model.
     */
    let board = updates.signal
        .reduce(initial_model, function(evt, model) {
            if (evt) {
                switch (evt.type) {
                case 'canvas':
                    model.context = evt.data.getContext('2d');
                    break;
                case 'position':
                    model.board = model.board.clicked(evt.data);
                    break;
                case 'reset':
                    model.board = alm.utils.eraseGame();
                    break;
                }
            }
            if (model.context) {
                model.board = model.board.drawCells(model.context);
            }
            return model;
        })
        .recv((model) => utils.saveGame(model.board));

    canvas.signal
        .map((cnvs) => cnvs ? { type: 'canvas', data: cnvs } : undefined)
        .connect(updates.signal);

    /**
     * When the `load` event emits for the document, transform it into a signal
     * of virtual dom trees (which Alm expects).
     *
     * A mailbox has been subscribed to canvas render-events. Essentially, when
     * the canvas is (re-)rendered, it will send the element to the mailbox,
     * which then connects to the updates signal and gives the board a context
     * to finally start drawing on.
     */
    return events.load.map( () =>
        el('div', { 'class': 'container' , 'id': 'board' }, [
            el('canvas', {
                'id': 'board_canvas',
                'width': utils.boardWidth,
                'height': utils.boardHeight
            }).subscribe(canvas),
            el('footer', { 'class':'footer' }, [
                el('div', { 'class': 'container' }, [
                    el('button', { 'id':'reset-btn' }, [
                        "Reset game"
                    ]),
                    el('p', {}, [
                        el('a', {
                            'href': 'https://github.com/gatlin/kamisado/blob/master/README.md'
                        }, [ "How to play and more info available here." ]),
                        " Made with ",
                        el('a', { 'href': 'https://github.com/gatlin/Alm' },
                            [ "Alm" ] ),
                        ". ",
                        el('a', { 'href': 'https://github.com/gatlin/Kamisado' },
                            [ "Source code on GitHub." ])
                    ])
                ])
            ])
        ])
    );
})

.start();

})();
