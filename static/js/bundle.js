/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(1), __webpack_require__(4)], __WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports, alm_1, board_1) {
	    "use strict";
	    var canvasMBox = new alm_1.Mailbox(null);
	    var Actions;
	    (function (Actions) {
	        Actions[Actions["ResizeStart"] = 0] = "ResizeStart";
	        Actions[Actions["ResizeStop"] = 1] = "ResizeStop";
	        Actions[Actions["CanvasUpdate"] = 2] = "CanvasUpdate";
	        Actions[Actions["Click"] = 3] = "Click";
	    })(Actions || (Actions = {}));
	    ;
	    function calculate_geometry() {
	        var size = 8;
	        var boardSide = 0.9 * (Math.min(window.innerWidth, window.innerHeight - 50));
	        var tileSide = (boardSide / size);
	        var radius = (tileSide * 0.9) / 2;
	        return {
	            size: size,
	            boardSide: boardSide,
	            tileSide: tileSide,
	            radius: radius
	        };
	    }
	    function new_game() {
	        var grid = [
	            1, 2, 3, 4, 5, 6, 7, 8,
	            0, 0, 0, 0, 0, 0, 0, 0,
	            0, 0, 0, 0, 0, 0, 0, 0,
	            0, 0, 0, 0, 0, 0, 0, 0,
	            0, 0, 0, 0, 0, 0, 0, 0,
	            0, 0, 0, 0, 0, 0, 0, 0,
	            0, 0, 0, 0, 0, 0, 0, 0,
	            16, 15, 14, 13, 12, 11, 10, 9];
	        return new board_1.Board(grid, new board_1.Pos(0, 0), 'default');
	    }
	    ;
	    function new_state() {
	        var geom = calculate_geometry();
	        return {
	            board: new_game(),
	            geom: geom,
	            context: null,
	            resizing: false,
	            resizeStart: -1
	        };
	    }
	    function update(action, state) {
	        if (action['type'] === Actions.ResizeStart) {
	            var evt = action.data.evt;
	            state.resizeStart = Date.now();
	            var resizeFinish_1 = function () {
	                if (Date.now() - state.resizeStart < 200) {
	                    window.setTimeout(resizeFinish_1, 200);
	                }
	                else {
	                    state.resizing = false;
	                    state.geom = calculate_geometry();
	                    action.data.actions.send({
	                        'type': Actions.ResizeStop
	                    });
	                }
	            };
	            if (state.resizing === false) {
	                state.resizing = true;
	                window.setTimeout(resizeFinish_1, 200);
	            }
	        }
	        if (action['type'] === Actions.ResizeStop) {
	            return state;
	        }
	        if (action['type'] === Actions.CanvasUpdate && action.data !== null) {
	            var canvasEl = action.data;
	            state.context = canvasEl.getContext('2d');
	        }
	        if (action['type'] === Actions.Click) {
	            var raw = action.data;
	            var rect = raw
	                .target
	                .getBoundingClientRect();
	            var xCoord = raw.clientX - rect.left;
	            var yCoord = raw.clientY - rect.top;
	            var pos = new board_1.Pos(Math.floor(xCoord / state.geom.tileSide), Math.floor(yCoord / state.geom.tileSide));
	            state.board = board_1.boardClicked(state.board, pos);
	            if (state.board.won !== null) {
	            }
	        }
	        if (state.context) {
	            state.board.drawCells(state.context, state.geom);
	        }
	        return state;
	    }
	    function main(scope) {
	        scope.ports.resize_event
	            .recv(function (evt) {
	            scope.actions.send({
	                'type': Actions.ResizeStart,
	                data: {
	                    evt: evt,
	                    updates: scope.actions
	                }
	            });
	        });
	        scope.events.click
	            .filter(function (evt) { return evt.getId() === 'board_canvas'; })
	            .recv(function (evt) {
	            scope.actions.send({
	                'type': Actions.Click,
	                'data': evt.getRaw()
	            });
	        });
	        canvasMBox
	            .recv(function (cnvs) {
	            scope.actions.send({
	                'type': Actions.CanvasUpdate,
	                'data': cnvs
	            });
	        });
	    }
	    function render(state) {
	        return alm_1.el('div', { 'class': 'container', 'id': 'board' }, [
	            alm_1.el('canvas', {
	                'id': 'board_canvas',
	                'width': state.geom.boardSide,
	                'height': state.geom.boardSide
	            }, []).subscribe(canvasMBox),
	            alm_1.el('footer', { 'class': 'footer' }, [
	                alm_1.el('div', { 'class': 'container' }, [
	                    alm_1.el('button', { 'id': 'reset-btn' }, [
	                        "Reset game"
	                    ]),
	                    alm_1.el('p', {}, [
	                        alm_1.el('a', {
	                            'href': 'https://github.com/gatlin/kamisado/blob/master/README.md'
	                        }, ["How to play and more info available here."]),
	                        " Made with ",
	                        alm_1.el('a', { 'href': 'https://github.com/gatlin/Alm' }, ["Alm"]),
	                        ". ",
	                        alm_1.el('a', { 'href': 'https://github.com/gatlin/Kamisado' }, ["Source code on GitHub."])
	                    ])
	                ])
	            ])
	        ]);
	    }
	    var app = new alm_1.App({
	        state: new_state(),
	        update: update,
	        main: main,
	        render: render,
	        eventRoot: 'app',
	        domRoot: 'app',
	        ports: ['resize_event']
	    }).start();
	    window.addEventListener('resize', function (evt) {
	        app.ports.resize_event.send(evt);
	    }, false);
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(2), __webpack_require__(3), __webpack_require__(2), __webpack_require__(3)], __WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports, base_1, vdom_1, base_2, vdom_2) {
	    "use strict";
	    function __export(m) {
	        for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
	    }
	    __export(base_1);
	    exports.el = vdom_1.el;
	    /**
	     * Wraps system events and provides some convenience methods.
	     * @constructor
	     * @param evt - The raw browser event value.
	     */
	    var AlmEvent = (function () {
	        function AlmEvent(evt) {
	            this.raw = evt;
	            this.classes = evt.target.className.trim().split(/\s+/g) || [];
	            this.id = evt.target.id;
	        }
	        AlmEvent.prototype.hasClass = function (klass) {
	            return (this.classes.indexOf(klass) !== -1);
	        };
	        AlmEvent.prototype.getClasses = function () {
	            return this.classes;
	        };
	        AlmEvent.prototype.getId = function () {
	            return this.id;
	        };
	        AlmEvent.prototype.getValue = function () {
	            return this.raw.target.value;
	        };
	        AlmEvent.prototype.getRaw = function () {
	            return this.raw;
	        };
	        return AlmEvent;
	    }());
	    exports.AlmEvent = AlmEvent;
	    /**
	     * Constructs signals emitting whichever browser event names you pass in.
	     * @param {Array<string>} evts - The event names you want signals for.
	     * @return {Array<Signal>} The event signals.
	     */
	    function makeEvents(evts) {
	        var events = {};
	        for (var i = 0; i < evts.length; i++) {
	            var evtName = evts[i];
	            events[evtName] = new base_2.Signal(function (evt) { return new AlmEvent(evt); });
	        }
	        return events;
	    }
	    /**
	     * Builds the port signals for an App.
	     * @param {Object} portCfg - An object whose keys name arrays of desired port
	     *                           names.
	     *                           Eg, { outbound: ['port1','port2' ],
	     *                                 inbound: ['port3'] }.
	     *
	     * @return {Object} ports - An object with the same keys but this time they
	     *                          point to objects whose keys were in the original
	     *                          arrays and whose values are signals.
	     */
	    function makePorts(portCfg) {
	        // If it is simply an array then make ports for each string
	        if (Array.isArray(portCfg)) {
	            var _ports = {};
	            for (var i = 0; i < portCfg.length; i++) {
	                var portName = portCfg[i];
	                _ports[portName] = base_2.Signal.make();
	            }
	            return _ports;
	        }
	        var ports = (typeof portCfg === 'undefined' || portCfg === null)
	            ? { outbound: [], inbound: [] }
	            : portCfg;
	        for (var key in ports) {
	            var portNames = ports[key];
	            var portSpace = {};
	            for (var i = 0; i < portNames.length; i++) {
	                var portName = portNames[i];
	                portSpace[portName] = base_2.Signal.make();
	            }
	            ports[key] = portSpace;
	        }
	        return ports;
	    }
	    var standardEvents = [
	        'click',
	        'dblclick',
	        'keyup',
	        'keydown',
	        'keypress',
	        'blur',
	        'focusout',
	        'input',
	        'change',
	        'load'
	    ];
	    /**
	     * A self-contained application.
	     * @constructor
	     * @param {AppConfig} cfg - the configuration object.
	     */
	    var App = (function () {
	        function App(cfg) {
	            this.gui = typeof cfg.gui === 'undefined'
	                ? true
	                : cfg.gui;
	            this.eventRoot = typeof cfg.eventRoot === 'string'
	                ? document.getElementById(cfg.eventRoot)
	                : typeof cfg.eventRoot === 'undefined'
	                    ? document
	                    : cfg.eventRoot;
	            this.domRoot = typeof cfg.domRoot === 'string'
	                ? document.getElementById(cfg.domRoot)
	                : typeof cfg.domRoot === 'undefined'
	                    ? document.body
	                    : cfg.domRoot;
	            var events = standardEvents.concat(typeof cfg.extraEvents !== 'undefined'
	                ? cfg.extraEvents
	                : []);
	            this.events = makeEvents(events);
	            this.ports = makePorts(cfg.ports);
	            // create the signal graph
	            var actions = new base_2.Mailbox(null);
	            var state = actions.reduce(cfg.state, function (action, model) {
	                if (action === null) {
	                    return model;
	                }
	                return cfg.update(action, model);
	            });
	            this.scope = Object.seal({
	                events: this.events,
	                ports: this.ports,
	                actions: actions,
	                state: state
	            });
	            cfg.main(this.scope);
	            this.render = this.gui ? cfg.render : null;
	        }
	        /**
	         * Internal method which registers a given signal to emit upstream browser
	         * events.
	         */
	        App.prototype.registerEvent = function (evtName, sig) {
	            var fn = function (evt) { return sig.send(evt); };
	            this.eventRoot.addEventListener(evtName, fn, true);
	        };
	        /**
	         * Provides access to the application scope for any other configuration.
	         *
	         * @param f - A function which accepts a scope and returns nothing.
	         * @return @this
	         */
	        App.prototype.editScope = function (cb) {
	            cb(this.scope);
	            return this;
	        };
	        /**
	         * Set the root element in the page to which we will attach listeners.
	         * @param er - Either an HTML element, the whole document, or an element ID
	         *             as a string.
	         * @return @this
	         */
	        App.prototype.setEventRoot = function (er) {
	            this.eventRoot = typeof er === 'string'
	                ? document.getElementById(er)
	                : er;
	            return this;
	        };
	        /**
	         * Set the root element in the page in which we will render.
	         * @param er - Either an HTML element, the whole document, or an element ID
	         *             as a string.
	         * @return @this
	         */
	        App.prototype.setDomRoot = function (dr) {
	            this.domRoot = typeof dr === 'string'
	                ? document.getElementById(dr)
	                : dr;
	            return this;
	        };
	        /**
	         * This method actually registers the desired events and creates the ports.
	         * @return An object containing the App's port signals and a state update
	         * signal.
	         */
	        App.prototype.start = function () {
	            /* Find all the event listeners the user cared about and bind those */
	            for (var evtName in this.events) {
	                var sig = this.events[evtName];
	                if (sig.numListeners() > 0) {
	                    this.registerEvent(evtName, sig);
	                }
	            }
	            if (this.gui) {
	                var view = this.scope.state.map(this.render);
	                vdom_2.render(view, this.domRoot);
	            }
	            return {
	                ports: this.scope.ports,
	                state: this.scope.state
	            };
	        };
	        return App;
	    }());
	    exports.App = App;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	/*
	[1]: The proper thing for it to wrap would be the type `Event`. However I also
	want to be able to make assumptions about the target because I'll be getting
	them exclusively from the browser. I do not know the proper TypeScript-fu yet
	for expressing this properly.

	[2]: I don't know the typescript way of saying "an object of string literal keys
	which point to arrays of names. any number of such keys, or none at all."
	*/


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports], __WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports) {
	    "use strict";
	    /**
	     * Permits something akin to traits and automatically derived functions. The
	     * type receiving the traits must implement stub properties with the correct
	     * names.
	     *
	     * @param derivedCtor - the constructor you want to add traits to.
	     * @param baseCtors - the parent constructors you wish to inherit traits from.
	     */
	    function derive(derivedCtor, baseCtors) {
	        baseCtors.forEach(function (baseCtor) {
	            Object.getOwnPropertyNames(baseCtor.prototype).forEach(function (name) {
	                derivedCtor.prototype[name] = baseCtor.prototype[name];
	            });
	        });
	    }
	    exports.derive = derive;
	    /**
	     * Using `derive` you can get an implementation of flatMap for free by
	     * implementing this class as an interface with a null return value for flatMap.
	     */
	    var FlatMap = (function () {
	        function FlatMap() {
	        }
	        FlatMap.pipe = function (ms) {
	            var v = ms[0];
	            for (var i = 1; i < ms.length; i++) {
	                v = v.flatMap(ms[i]);
	            }
	            return v;
	        };
	        FlatMap.prototype.flatMap = function (f) {
	            return this.map(f).flatten();
	        };
	        FlatMap.prototype.pipe = function (ms) {
	            var me = this;
	            for (var i = 0; i < ms.length; i++) {
	                me = me.flatMap(ms[i]);
	            }
	            return me;
	        };
	        return FlatMap;
	    }());
	    exports.FlatMap = FlatMap;
	    /** Utility function to perform some function asynchronously. */
	    function async(f) {
	        setTimeout(f, 0);
	    }
	    exports.async = async;
	    /**
	     * Signals route data through an application.
	    
	     * A signal is a unary function paired with an array of listeners. When a signal
	     * receives a value it computes a result using its function and then sends that
	     * to each of its listeners.
	     *
	     * @constructor
	     * @param fn - A unary function.
	     */
	    var Signal = (function () {
	        function Signal(fn) {
	            this.fn = fn;
	            this.listeners = [];
	        }
	        /** Attaches the argument as a listener and then returns the argument. */
	        Signal.prototype.connect = function (sig) {
	            this.listeners.push(sig);
	            return sig;
	        };
	        /** Convenience constructor. */
	        Signal.make = function () {
	            return new Signal(function (x) { return x; });
	        };
	        /**
	         * Gives the argument to the signal's internal function and then sends the
	         * result to all its listeners.
	         *
	         * @param x - The value to send.
	         * @return Nothing
	         */
	        Signal.prototype.send = function (x) {
	            var v = this.fn(x);
	            if (typeof v !== 'undefined') {
	                for (var i = 0; i < this.listeners.length; i++) {
	                    var r = this.listeners[i];
	                    r.send(v);
	                }
	            }
	        };
	        Signal.prototype.recv = function (f) {
	            this.connect(new Signal(function (v) { return f(v); }));
	        };
	        /**
	         * Creates a new signal with the specified function, attaches it to this
	         * signal, and returns the newly created signal.
	         *
	         * @param f - A unary function with which to create a new signal.
	         * @return a new signal attached to this one.
	         */
	        Signal.prototype.map = function (f) {
	            var sig = new Signal(f);
	            return this.connect(sig);
	        };
	        /**
	         * Creates a new signal which will only propagate a value if a condition
	         * is met. The new signal will be attached as a listener to this one.
	         *
	         * @param cond - A unary function returning a boolean.
	         * @return a new Signal attached as a listener to this Signal.
	         */
	        Signal.prototype.filter = function (cond) {
	            var r = new Signal(function (v) {
	                if (cond(v)) {
	                    return v;
	                }
	            });
	            return this.connect(r);
	        };
	        /**
	         * Creates a new signal which reduces incoming values using a supplied
	         * function and an initial value. The new signal will be attached as a
	         * listener to this one.
	         *
	         * @param initial - An initial value for the reduction.
	         * @param reducer - A function accepting new signal values and the old
	         *                  reduced value.
	         * @return a new Signal attached as a listener to this Signal.
	         */
	        Signal.prototype.reduce = function (initial, reducer) {
	            var state = initial;
	            var r = new Signal(function (v) {
	                state = reducer(v, state);
	                return state;
	            });
	            return this.connect(r);
	        };
	        Signal.prototype.numListeners = function () {
	            return this.listeners.length;
	        };
	        return Signal;
	    }());
	    exports.Signal = Signal;
	    /**
	     * A signal to which you may send and receive values. Messages are sent
	     * asynchronously. You must supply an initial value to send.
	     *
	     * This makes Mailboxes useful for kicking off any initial actions that must
	     * be taken. Internally a Mailbox is used for initial state reduction by App.
	     */
	    var Mailbox = (function (_super) {
	        __extends(Mailbox, _super);
	        function Mailbox(t) {
	            _super.call(this, function (x) { return x; });
	            this.send(t);
	        }
	        Mailbox.prototype.send = function (t) {
	            var _this = this;
	            async(function () {
	                _super.prototype.send.call(_this, t);
	            });
	        };
	        Mailbox.prototype.recv = function (k) {
	            _super.prototype.recv.call(this, k);
	        };
	        return Mailbox;
	    }(Signal));
	    exports.Mailbox = Mailbox;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports], __WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports) {
	    "use strict";
	    /** Helper function for creating VTrees exported to the top level. */
	    function el(tag, attrs, children) {
	        var children_trees = (typeof children === 'undefined')
	            ? []
	            : children.map(function (kid, idx) {
	                return typeof kid === 'string'
	                    ? new VTree(kid, [], VTreeType.Text)
	                    : kid;
	            });
	        return new VTree({
	            tag: tag,
	            attrs: attrs
	        }, children_trees, VTreeType.Node);
	    }
	    exports.el = el;
	    var VTreeType;
	    (function (VTreeType) {
	        VTreeType[VTreeType["Text"] = 0] = "Text";
	        VTreeType[VTreeType["Node"] = 1] = "Node";
	    })(VTreeType || (VTreeType = {}));
	    ;
	    /**
	     * A rose tree representing DOM elements. Can represent either an element node
	     * or a text node.
	     *
	     * Because VTree is lighter weight than actual DOM elements an efficient diff
	     * procedure can be used to compare old and new trees and determine what needs
	     * to be done to the actual DOM.
	     *
	     * The {@link VTree#key} property is used to determine equality. If a `key`
	     * attribute is provided, it will be used. If there is not one, then `id` will
	     * be used. Failing that the tag name will be used. If this is a text node, the
	     * text itself will be used. I'm open to other possibilities, especially
	     * regarding that last one.
	     */
	    var VTree = (function () {
	        function VTree(content, children, treeType) {
	            this.content = content;
	            this.children = children;
	            this.treeType = treeType;
	            this.mailbox = null;
	            /* There must be a key */
	            if (treeType === VTreeType.Node) {
	                if ('key' in this.content.attrs) {
	                    this.key = this.content.attrs.key;
	                    delete this.content.attrs.key;
	                }
	                else if ('id' in this.content.attrs) {
	                    this.key = this.content.attrs.id;
	                }
	                else {
	                    this.key = this.content.tag;
	                }
	            }
	            else {
	                this.key = 'text-node';
	            }
	        }
	        /**
	         * Whenever this VTree is re-rendered the DOM node will be sent to this
	         * Mailbox. This is useful in case an important element is recreated and you
	         * need an up to date reference to it.
	         */
	        VTree.prototype.subscribe = function (mailbox) {
	            this.mailbox = mailbox;
	            return this;
	        };
	        /** Equality based on the key. */
	        VTree.prototype.eq = function (other) {
	            if (!other) {
	                return false;
	            }
	            return (this.key === other.key);
	        };
	        return VTree;
	    }());
	    exports.VTree = VTree;
	    /** Constructs an actual DOM node from a {@link VTree}. */
	    function makeDOMNode(tree) {
	        if (tree === null) {
	            return null;
	        }
	        if (tree.treeType === VTreeType.Text) {
	            return document.createTextNode(tree.content);
	        }
	        var el = document.createElement(tree.content.tag);
	        for (var key in tree.content.attrs) {
	            el.setAttribute(key, tree.content.attrs[key]);
	        }
	        for (var i = 0; i < tree.children.length; i++) {
	            var child = makeDOMNode(tree.children[i]);
	            el.appendChild(child);
	        }
	        // if a mailbox was subscribed, notify it the element was re-rendered
	        if (tree.mailbox !== null) {
	            tree.mailbox.send(el);
	        }
	        return el;
	    }
	    /** Constructs an initial DOM from a {@link VTree}. */
	    function initialDOM(domRoot, tree) {
	        var root = domRoot;
	        var domTree = makeDOMNode(tree);
	        while (root.firstChild) {
	            root.removeChild(root.firstChild);
	        }
	        root.appendChild(domTree);
	    }
	    /**
	     * A simple enum representing three kinds of array edit operations.
	     */
	    var Op;
	    (function (Op) {
	        Op[Op["Merge"] = 0] = "Merge";
	        Op[Op["Delete"] = 1] = "Delete";
	        Op[Op["Insert"] = 2] = "Insert";
	    })(Op || (Op = {}));
	    ;
	    /**
	     * Computes an array of edit operations allowing the first argument to be
	     * transformed into the second argument.
	     *
	     * @param a - The original array
	     * @param b - The the desired array
	     * @param eq - An equality testing function for elements in the arrays.
	     * @return An array of {@link Op} values.
	     */
	    function diff_array(a, b, eq) {
	        if (!a.length) {
	            return b.map(function (c) { return [Op.Insert, null, c]; });
	        }
	        if (!b.length) {
	            return a.map(function (c) { return [Op.Delete, c, null]; });
	        }
	        var m = a.length + 1;
	        var n = b.length + 1;
	        var d = new Array(m * n);
	        var moves = [];
	        for (var i_1 = 0; i_1 < m; i_1++) {
	            d[i_1 * n] = i_1;
	        }
	        for (var j_1 = 0; j_1 < n; j_1++) {
	            d[j_1] = j_1;
	        }
	        for (var j_2 = 1; j_2 < n; j_2++) {
	            for (var i_2 = 1; i_2 < m; i_2++) {
	                if (eq(a[i_2 - 1], b[j_2 - 1])) {
	                    d[i_2 * n + j_2] = d[(i_2 - 1) * n + (j_2 - 1)];
	                }
	                else {
	                    d[i_2 * n + j_2] = Math.min(d[(i_2 - 1) * n + j_2], d[i_2 * n + (j_2 - 1)])
	                        + 1;
	                }
	            }
	        }
	        var i = m - 1, j = n - 1;
	        while (!(i === 0 && j === 0)) {
	            if (eq(a[i - 1], b[j - 1])) {
	                i--;
	                j--;
	                moves.unshift([Op.Merge, a[i], b[j]]);
	            }
	            else {
	                if (d[i * n + (j - 1)] <= d[(i - 1) * n + j]) {
	                    j--;
	                    moves.unshift([Op.Insert, null, b[j]]);
	                }
	                else {
	                    i--;
	                    moves.unshift([Op.Delete, a[i], null]);
	                }
	            }
	        }
	        return moves;
	    }
	    exports.diff_array = diff_array;
	    /**
	     * The name is a little misleading. This takes an old and a current
	     * {@link VTree}, the parent node of the one the old tree represents,
	     * and an (optional) index into that parent's childNodes array.
	     *
	     * If either of the trees is null or undefined this triggers DOM node creation
	     * or destruction.
	     *
	     * If both are nodes then attributes are reconciled followed by children.
	     *
	     * Otherwise the new tree simply overwrites the old one.
	     *
	     * While this does not perform a perfect tree diff it doesn't need to and
	     * performance is (probably) the better for it. In typical cases a DOM node will
	     * add or remove a few children at once, and the grandchildren will not need to
	     * be recovered from their parents. Meaning starting from the root node we can
	     * treat this as a list diff problem for the children and then, once children
	     * are paired up, we can recurse on them.
	     */
	    function diff_dom(parent, a, b, index) {
	        if (index === void 0) { index = 0; }
	        if (typeof b === 'undefined' || b === null) {
	            parent.removeChild(parent.childNodes[index]);
	            return;
	        }
	        if (typeof a === 'undefined' || a === null) {
	            parent.insertBefore(makeDOMNode(b), parent.childNodes[index]);
	            return;
	        }
	        if (b.treeType === VTreeType.Node) {
	            if (a.treeType === VTreeType.Node) {
	                if (a.content.tag === b.content.tag) {
	                    // contend with attributes. only necessary changes.
	                    var dom = parent.childNodes[index];
	                    for (var attr in a.content.attrs) {
	                        if (!(attr in b.content.attrs)) {
	                            dom.removeAttribute(attr);
	                            delete dom[attr];
	                        }
	                    }
	                    for (var attr in b.content.attrs) {
	                        var v = b.content.attrs[attr];
	                        if (!(attr in a.content.attrs) ||
	                            v !== a.content.attrs[attr]) {
	                            dom[attr] = v;
	                            dom.setAttribute(attr, v);
	                        }
	                    }
	                    // contend with the children.
	                    var moves = diff_array(a.children, b.children, function (a, b) {
	                        if (typeof a === 'undefined')
	                            return false;
	                        return a.eq(b);
	                    });
	                    var domIndex = 0;
	                    for (var i = 0; i < moves.length; i++) {
	                        var move = moves[i];
	                        diff_dom(parent.childNodes[index], move[1], move[2], domIndex);
	                        if (move[0] !== Op.Delete) {
	                            domIndex++;
	                        }
	                    }
	                }
	            }
	        }
	        else {
	            // different types of nodes, `b` is a text node, or they have different
	            // tags. in all cases just replace the DOM element.
	            parent.replaceChild(makeDOMNode(b), parent.childNodes[index]);
	        }
	    }
	    exports.diff_dom = diff_dom;
	    /**
	     * This reduces a Signal producing VTrees.
	     *
	     * @param view_signal - the Signal of VTrees coming from the App.
	     * @param domRoot - The root element we will be rendering the VTree in.
	     */
	    function render(view_signal, domRoot) {
	        view_signal.reduce(null, function (update, tree) {
	            if (tree === null) {
	                initialDOM(domRoot, update);
	            }
	            else {
	                diff_dom(domRoot, tree, update);
	            }
	            return update;
	        });
	    }
	    exports.render = render;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports], __WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports) {
	    "use strict";
	    var colors = [
	        '#F5B437',
	        '#3340AE',
	        '#1E8AD1',
	        '#F8D6C4',
	        '#F6E500',
	        '#DC442F',
	        '#BAD360',
	        '#6B451E',
	        '#080D07',
	        '#F4FFF4' // 9:  player 1
	    ];
	    var tileColorPattern = [
	        [0, 1, 2, 3, 4, 5, 6, 7],
	        [5, 0, 3, 6, 1, 4, 7, 2],
	        [6, 3, 0, 5, 2, 7, 4, 1],
	        [3, 2, 1, 0, 7, 6, 5, 4],
	        [4, 5, 6, 7, 0, 1, 2, 3],
	        [1, 4, 7, 2, 5, 0, 3, 6],
	        [2, 7, 4, 1, 6, 3, 0, 5],
	        [7, 6, 5, 4, 3, 2, 1, 0]
	    ];
	    var Pos = (function () {
	        function Pos(x, y) {
	            this.x = x;
	            this.y = y;
	        }
	        return Pos;
	    }());
	    exports.Pos = Pos;
	    var Board = (function () {
	        function Board(grid, pos, gameId, active, player) {
	            if (active === void 0) { active = null; }
	            if (player === void 0) { player = 0; }
	            this.grid = grid;
	            this.pos = pos;
	            this.gameId = gameId;
	            this.player = player;
	            this.won = null;
	            this.active = active;
	        }
	        Board.prototype.setPos = function (pos) {
	            this.pos = pos;
	            return this;
	        };
	        Board.prototype.extract = function () {
	            return this.grid[this.pos.y * 8 + this.pos.x];
	        };
	        Board.prototype.duplicate = function () {
	            var oldGrid = this.grid;
	            var x, y, grid = new Array(64);
	            for (y = 0; y < 8; y++) {
	                for (x = 0; x < 8; x++) {
	                    grid[y * 8 + x] = new Board(oldGrid, new Pos(x, y), this.gameId, this.active, this.player);
	                }
	            }
	            return new Board(grid, this.pos, this.gameId, this.active, this.player);
	        };
	        Board.prototype.map = function (f) {
	            var x, y, grid = [];
	            for (y = 0; y < 8; y++) {
	                for (x = 0; x < 8; x++) {
	                    grid[y * 8 + x] = f(this.grid[y * 8 + x]);
	                }
	            }
	            return this;
	        };
	        Board.prototype.convolve = function (f) {
	            return this.duplicate().map(f);
	        };
	        Board.prototype.selectNextPiece = function () {
	            var x, y, nextCell;
	            var activeColor = tileColorPattern[this.active.y][this.active.x];
	            var nextPiece = (activeColor + 1) + (this.player * 8);
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
	        };
	        Board.prototype.emptyPath = function (srcPos, dstPos) {
	            var dX = dstPos.x - srcPos.x, dY = dstPos.y - srcPos.y, stepX = (dX ? Math.abs(dX) / dX : 0), stepY = Math.abs(dY) / dY;
	            var pathIsEmpty = true, x = srcPos.x + stepX, y = srcPos.y + stepY;
	            while (y !== dstPos.y && pathIsEmpty) {
	                if (this.grid[y * 8 + x]) {
	                    pathIsEmpty = false;
	                }
	                y += stepY;
	                x += stepX;
	            }
	            return pathIsEmpty;
	        };
	        Board.prototype.drawCells = function (context, geom) {
	            this.convolve(drawCell(context, geom));
	        };
	        Board.prototype.gridGet = function (x, y) {
	            return this.grid[y * 8 + x];
	        };
	        Board.prototype.gridSet = function (x, y, a) {
	            this.grid[y * 8 + x] = a;
	            return this;
	        };
	        return Board;
	    }());
	    exports.Board = Board;
	    function legalMove(board) {
	        return ((board.player
	            ? board.active.y > board.pos.y
	            : board.active.y < board.pos.y)
	            && (board.extract() === 0)
	            && ((Math.abs(board.active.x - board.pos.x)
	                === Math.abs(board.active.y - board.pos.y))
	                || (board.active.x - board.pos.x) === 0))
	            && (board.emptyPath(board.active, board.pos));
	    }
	    function drawCell(context, geom) {
	        return function (board) {
	            var tileSide = geom.tileSide;
	            var size = geom.size;
	            var radius = geom.radius;
	            // draw the background color
	            var cell = board.extract(); // `pos`
	            var cellColor = colors[tileColorPattern[board.pos.y][board.pos.x]];
	            context.fillStyle = cellColor;
	            context.fillRect(board.pos.x * tileSide, board.pos.y * tileSide, tileSide, tileSide);
	            if (cell === 0) {
	                return cell;
	            }
	            // if there is a piece on this cell, draw it as well
	            var x = board.pos.x + 1;
	            var y = board.pos.y + 1;
	            var center = {
	                x: ((x) * tileSide) - (tileSide / 2),
	                y: ((y) * tileSide) - (tileSide / 2)
	            };
	            var bezel = (cell > size) ? colors[9] : colors[8];
	            var color = colors[(cell - 1) % 8];
	            // bezel
	            context.beginPath();
	            context.arc(center.x, center.y, radius, 0, Math.PI * 2, false);
	            context.closePath();
	            context.fillStyle = bezel;
	            context.fill();
	            context.strokeStyle = bezel;
	            context.stroke();
	            // piece color
	            context.beginPath();
	            context.arc(center.x, center.y, radius * 0.75, 0, Math.PI * 2, false);
	            context.closePath();
	            context.fillStyle = color;
	            context.fill();
	            context.strokeStyle = color;
	            context.stroke();
	            if (board.active !== null &&
	                board.active.x === board.pos.x &&
	                board.active.y === board.pos.y) {
	                context.beginPath();
	                context.arc(center.x, center.y, radius * 0.5, 0, Math.PI * 2, false);
	                context.fillStyle = bezel;
	                context.fill();
	                context.strokeStyle = bezel;
	                context.stroke();
	            }
	            return cell;
	        };
	    }
	    function boardClicked(board, clickPos) {
	        var cell = board.setPos(clickPos).extract();
	        if (board.active === null) {
	            board.active = new Pos(-1, -1);
	        }
	        // is this cell already active?
	        if (board.active.x === board.pos.x &&
	            board.active.y === board.pos.y) {
	            // do nothing
	            board.player = (board.player) ? 0 : 1;
	            return board.selectNextPiece();
	        }
	        else {
	            // not active and the cell contains a piece
	            // -> select this new piece
	            if (cell > 0) {
	                board.active.x = board.pos.x;
	                board.active.y = board.pos.y;
	            }
	            // not active and cell does not contain a piece
	            // -> move the currently active piece here
	            if (cell === 0) {
	                if (!legalMove(board)) {
	                    return board;
	                }
	                // else ...
	                board = board.gridSet(board.pos.x, board.pos.y, board.gridGet(board.active.x, board.active.y));
	                board = board.gridSet(board.active.x, board.active.y, 0);
	                board.active = board.pos;
	                // has somebody won?
	                if ((!board.player && (board.pos.y === 7))
	                    || (board.player && (board.pos.y === 0))) {
	                    board.won = board.pos.y ? 1 : 0;
	                }
	                board.player = (board.player) ? 0 : 1;
	            }
	        }
	        return board.selectNextPiece();
	    }
	    exports.boardClicked = boardClicked;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }
/******/ ]);