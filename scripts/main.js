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
        .recv((evt) => updates.send(evt));

    /**
     * When the reset button is clicked, erase the game (which will trigger a
     * window refresh.
     */
    events.mouse.click
        .filter((evt) => evt.target.id === 'reset-btn')
        .recv((evt) => utils.eraseGame());

    // The initial game state
    let initial_model = {
        board: utils.loadGame(), // board state
        context: null            // display canvas
    };

    /**
     * Listen for update events (which for now are positions). Because
     * mailboxes always fire at least once with their first value, we know the
     * first time this is run that `pos` will be null. If that's the case, we
     * don't register a click with the board.
     *
     * If the canvas drawing context hasn't been initialized yet, we do so here
     * as well. This happens here because `updates` will only emit an event
     * after the browser has rendered the view so we can be certain that the
     * initial canvas has been rendered in the DOM.
     *
     * Finally we update the board's state, give it the context so it can
     * redraw, and return the updated model to save it.
     */
    updates.signal
        .reduce(initial_model, function(pos, model) {
            // If we haven't gotten a canvas context yet, let's do so now
            if (!model.context) {
                model.context = alm.byId('board_canvas').getContext('2d');
            }
            if (pos) {
                model.board = model.board.clicked(pos);
            }
            model.board = model.board.drawCells(model.context);
            return model;
        })
        .recv((model) => utils.saveGame(model.board));

    /**
     * The `main` function in an Alm application must return a signal of
     * Virtual DOM objects. The idea is every time this signal emits, Alm
     * redraws the page efficiently.
     *
     * Problem is, we want to give the Board a canvas context to draw with, so
     * the canvas has to have been rendered first. Once this happens, we can
     * grab the context, give it to the board, and go on our merry way.
     *
     * The `load` event will fire before any of the mailboxes do, so this
     * ensures the DOM will be rendered at that a canvas will exist by the time
     * we grab the canvas context manually above. It's a hack; issue #11 on
     * alm's github page will address this.
     */
    return events.load.map( () =>
        el('div', { 'class': 'container' , 'id': 'board' }, [
            el('canvas', {
                'id': 'board_canvas',
                'width': utils.boardWidth,
                'height': utils.boardHeight
            }),
            el('footer', { 'class':'footer' }, [
                el('div', { 'class': 'container' }, [
                    el('button', { 'id':'reset-btn' }, [
                        "Reset game"
                    ])
                ])
            ])
        ])
    );
})

.start();

})();
