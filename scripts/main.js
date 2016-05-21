(function() {
'use strict';

var app = App.init()

/* `setup` is found in `scripts/scope.js`. */
.runtime(setup)

/* High level application logic */
.main(function(alm) {
    let el = alm.el
      , events = alm.events
      , scope = alm.scope
      , Pos = scope.Pos
      , Board = scope.Board
      ;

    let redraw = alm.mailbox(null);
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
            return new Pos(Math.floor(xCoord / scope.geom.tileSide),
                           Math.floor(yCoord / scope.geom.tileSide));
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
        board: scope.loadGame(), // board state
        context: null            // display canvas
    };

    /**
     * Listen for update events.
     *
     * Position updates are when a player selects a tile to move their piece
     * to; the payload is, unsurprisingly, the coordinate.
     *
     * Canvas updates occur when the dom re-renders the canvas (hopefully
     * infrequently). When this happens the canvas drawing context is updated
     * in the model.
     *
     * Reset updates tell us to discard the current game state and redraw a
     * fresh board.
     */
    updates.signal
        .reduce(initial_model, function(evt, model) {
            if (evt) {
                switch (evt.type) {
                case 'canvas':
                    model.context = evt.data.getContext('2d');
                    break;
                case 'position':
                    model.board = model.board.clicked(evt.data);
                    if (model.board.won !== null) {
                        model.board = alm.scope.eraseGame();
                    }
                    break;
                case 'reset':
                    model.board = alm.scope.eraseGame();
                    break;
                }
            }
            if (model.context) {
                model.board = model.board.drawCells(model.context);
            }
            return model;
        })
        .recv((model) => scope.saveGame(model.board));

    /**
     * A mailbox called `canvas` is subscribed below to the HTML canvas element
     * on which we draw the game. Whenever it is re-rendered this mailbox will
     * be sent the actual DOM node so that the new drawing context can be given
     * to the Board.
     */
    canvas.signal
        .map((cnvs) => cnvs ? { type: 'canvas', data: cnvs } : undefined)
        .connect(updates.signal);

    /**
     * We set up a custom event handler for window resize events in `scope.js`.
     * Redrawing the board on every resize event would be wasteful and look
     * terrible. Instead, we set a timer. When it goes off, if the window is
     * still resizing it restarts itself; if not, it initiates a redrawing.
     */
    events.resize
        .recv(function(evt) {
            scope.resizeStart = alm.timer.now();
            function resizeFinish() {
                if (alm.timer.now() - scope.resizeStart < 200) {
                    alm.setTimeout(resizeFinish, 200);
                } else {
                    scope.resizing = false;
                    scope.geom = scope.calculateGeometry();
                    redraw.send(null);
                    // as long as the value sent to updates has a `type` key
                    // it's fine
                    updates.send({ type: 'resize', data: null });
                }
            }
            if (scope.resizing === false) {
                scope.resizing = true;
                alm.setTimeout(resizeFinish,200);
            }
        });

    /* This fires at least once because it's a mailbox signal, and subsequently
     * on each redraw. */
    return redraw.signal.map( () =>
        el('div', { 'class': 'container' , 'id': 'board' }, [
            el('canvas', {
                'id': 'board_canvas',
                'width': scope.geom.boardSide,
                'height': scope.geom.boardSide,
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
