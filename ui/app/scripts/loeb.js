(function() {

    'use strict';

/***
 * loeb.js
 *
 * Named in honor of Martin Hugo Löb.
 *
 * This is a set of Javascript utilities which I will probably break out into
 * a separate library.
 */

/***
 * Pure Utilities
 */

// for an example of this, there is a test at the bottom of this file
var Y = function(F) {
    return (function(x) {
        return F(function(y) { return (x(x))(y); }); })
           (function(x) {
        return F(function(y) { return (x(x))(y); }); }); };

function fix(F, cache) {
    if (!cache) {
        cache = {}; }
    return function(arg) {
        if (cache[arg]) {
            return cache[arg]; }
        var answer = (F(function(n) {
            return (fix(F, cache))(n); }))(arg) ;
        cache[arg] = answer ;
        return answer ; } ; }

function memothunk(f) {
    var cached = false;
    var result;
    return function() {
        if (cached) {
            return result; }
        cached = true;
        result = f();
        return result; }; }

function constant (y) {
    return function() {
        return y; }; }

function id(x) { return x; }

function compose(f, g) {
    return function(x) {
        return f(g(x)); }; }

/***
 * Functor method defaults
 */
function Functor() { return; }
Functor.prototype.force = function() {
    return this.map(function(x) { return x(); }); } ;

Functor.prototype.delay = function() {
    return this.map(function(x) { return (function() { return x; }); }); };

/***
 * Monad function defaults
 */

function Monad() { return; }
Monad.prototype.chain = function(f) {
    return this.map(f).flatten();
};

/***
 * Comonad function defaults
 */
function Comonad() { return; }
Comonad.prototype.extend = function(f) {
    return this.duplicate().map(f);
};

Comonad.prototype.evaluate = function() {
    var w = this;
    return memothunk(function() {
        return (function(u) {
            return w.ap(u.duplicate());
        })(w);
    })(); } ;

function wfix(w) {
    return memothunk(function() {
        return w.extract()(
            w.extend(function(x) {
                return wfix(x); })); }); }

/***
 * IO encapsulation
 */
function IO(unsafePerformIO) {
    this.start = memothunk(unsafePerformIO);
}

IO.of = function(o) {
    return new IO(function() {
        return o;
    });
};

IO.prototype.chain = function(f) {
    var io = this;
    return new IO(function() {
        return f(io.start()).start();
    });
};

IO.prototype.map = function(f) {
    var me = this;
    return new IO(function() {
        return f(me.start());
    });
};

IO.prototype.fork = function() {
    var io = this;
    return new IO(function() {
        setTimeout(function() {
            io.start();
        },0); }); };

// Is IO a comonad?
IO.prototype.extract = function() {
    return this.start();
};

IO.prototype.duplicate = function() {
    var me = this;
    return this.map(function() {
        return IO.of(me);
    });
};

IO.prototype.extend = Comonad.prototype.extend;

function sequence(fns) {
    fns.forEach(function(v) {
        v.start();
    });
}

/***
 * Functions are monads!
 */

// "mapping" is just function composition
Function.prototype.map = function(g) {
    var me = this;
    return (function(x) {
        return g(me(x));
    });
};

Function.prototype.force = Functor.prototype.force;
Function.prototype.delay = Functor.prototype.delay;

Function.of = constant;

/* "flattening" a function `f(x)` that returns a function `g(x)` means
 * 1. Giving the argument to `f` to obtain `g`; and
 * 2. Giving the same argument to `g`
 */
Function.prototype.flatten = function() {
    var me = this;
    return (function(x) {
        var y = (JSON.parse(JSON.stringify(x)));
        var f = me(x);
        return f(y);
    });
};

Function.prototype.chain = Monad.prototype.chain;

Function.prototype.read = function(f) {
    var me = this;
    return me.chain(function(x) {
        return function(threaded) {
            return f(threaded, x); }; }); };

// A Function is a comonad if its argument is a list
Function.prototype.extract = function() { return this([]); };
Function.prototype.duplicate = function() {
    var me = this;
    return (function(x) {
        return (function(y) {
            return me(y.concat(x)); }); }); };

Function.prototype.extend = Comonad.prototype.extend;

/***
 * Arrays are monads!
 */

if (!Array.of) {
    Array.of = function() {
        return Array.prototype.slice.call(arguments);
    };
}

Array.prototype.force = Functor.prototype.force;
Array.prototype.delay = Functor.prototype.delay;

Array.prototype.zipWith = function(xs, f) {
    var len = (this.length < xs.length) ? this.length : xs.length;
    var ary = new Array(len);
    for (var i = 0; i < len; i++) {
        ary[i] = f(this[i], xs[i]);
    }
    return ary;
};

Array.prototype.flatten = function() {
    return this.reduce(function(a, b) {
        return a.concat(b);
    }, []);
};

Array.prototype.chain = Monad.prototype.chain;

Array.prototype.ap = function(other) {
    return this.zipWith(other, function(f, a) {
        return (function() { return f(a); }); }) ; } ;

/***
 * A pointed array
 *
 * A mathematically sound Cursor must always have at least one element in it,
 * though I'm not going to include the performance penalty of checking this on
 * every operation.
 */

function Cursor(elems, index) {
    this.array = typeof elems !== 'undefined' ? elems : [];
    this.index = typeof index !== 'undefined' ? index : 0;
}

Cursor.prototype.show = function() {
    var a = "[";
    var b = this.array.reduce(function(acc, v) {
        return acc + " " + v.toString();
    }, " ");
    return a + b + " ]";
};

Cursor.prototype.map = function(f) {
    return new Cursor(this.array.map(f), this.index);
};

Cursor.prototype.force = Functor.prototype.force;
Cursor.prototype.delay = Functor.prototype.delay;

// A Cursor is a comonad
Cursor.prototype.extract = function() {
    return this.array[this.index];
};

Cursor.prototype.duplicate = function() {
    var ary = [];
    var me = this;
    for (var i = 0; i < this.array.length; i++) {
        ary[i] = new Cursor(me.array, i);
    }
    return new Cursor(ary, me.index);
};

Cursor.prototype.extend = Comonad.prototype.extend;

Cursor.prototype.ap = function(wa) {
    return this.extend(function(wf) {
        return memothunk(function() {
            return wf.extract()(wa.at(wf.index));
        }); }) ;
};

/*
 * FIXME
 *
 * Current implementation of `ap` isn't quite right, I suppose, so instead of
 * using the default implementation of `evaluate` I cheat a bit.
 */
Cursor.prototype.evaluate = function() {
    return this.extend(wfix); };

Cursor.prototype.setIndex = function(idx) {
    this.index = idx;
    return this;
};

Cursor.prototype.at = function(idx) {
    return this.array[idx];
};

/***
 * Pair
 */
function Pair(a, b) {
    this.fst = memothunk(function() { return a; });
    this.snd = memothunk(function() { return b; });
}

Pair.prototype.map = function(f) {
    return new Pair(this.fst(), f(this.snd())); } ;

Pair.prototype.force = Functor.prototype.force;
Pair.prototype.delay = Functor.prototype.delay;

Pair.prototype.extract = function() {
    return this.snd(); } ;

Pair.prototype.duplicate = function() {
    var _1 = this.fst()
      , me = this;

    return new Pair(_1, me); } ;

Pair.prototype.extend = Comonad.prototype.extend;

Pair.prototype.evaluate = function() {
    return this.extend(wfix);

};

// A pair is a monad if its first argument is a list
Pair.of = function(x) {
    return new Pair([], x); };

Pair.prototype.flatten = function() {
    var me = this;
    var snd = this.snd();
    return new Pair(me.fst().concat(snd.fst()), snd.snd()); };

Pair.prototype.chain = Monad.prototype.chain;

Pair.prototype.log = function(msg) {
    var me = this;
    return me.chain(function(x) {
        return new Pair(msg(x), x); }); };

Pair.prototype.yield = function() {
    var me = this;
    return me.chain(function(x) {
        return new Pair(function(f) { return f(x); }, x); }); };

/**
 * An infinite, lazily-generated Stream
 *
 * This is different to, but based on, work at
 *
 *     //streamjs.org
 *
 * Since JavaScript has a `null` value, all values are implicitly optional,
 * thus Stream is exhaustible (and, hence, both a monad and a comonad).
 */
function Stream(headV, nextF) {
    if (typeof headV !== 'undefined') {
        this.headV = headV; }
    this.nextF = typeof nextF !== 'undefined'
        ? memothunk(nextF)
        : memothunk(function () { return new Stream(); });
}

Stream.prototype.show = function() {
    return "" + this.head() + " ..."; };

Stream.make = function() {
    if (arguments.length === 0) {
        return new Stream();
    }
    var rest = Array.prototype.slice.call(arguments, 1);
    return new Stream(arguments[0], function() {
        return Stream.make.apply(null, rest);
    });
};

Stream.repeat = function(x) {
    return new Stream(x, function() { return Stream.repeat(x); });
};

Stream.prototype.head = function() {
    return this.headV;
};

Stream.prototype.tail = function() {
    return this.nextF();
};

Stream.prototype.empty = function() {
    return typeof this.headV === 'undefined';
};

Stream.prototype.map = function(f) {
    if (this.empty()) { return this; }
    var self = this;
    return new Stream(f(this.headV)
                     ,function() {
                         return self.tail().map(f); }
            );
};

Stream.prototype.force = Functor.prototype.force;
Stream.prototype.delay = Functor.prototype.delay;

Stream.prototype.reduce = function(f, v) {
    var me = this;
    var w = v;
    while (!me.empty()) {
        w = f(w, me.headV);
        me = me.tail();
    }
    return w;
};

Stream.prototype.filter = function(pred) {
    if (this.empty()) { return this; }
    var h = this.headV;
    var t = this.tail();
    if (pred(h)) {
        return new Stream(h, function() {
            return t.filter(pred);
        });
    }
    return t.filter(pred);
};

Stream.prototype.ap = function(s) {
    if (this.empty() || s.empty()) {
        return new Stream();
    }
    var me = this
      , f  = this.extract()
      , a  = s.extract()
      , t  = s.tail()
      , ne = me.tail()
      ;
    return new Stream(f(a), function() {
        return ne.ap(t);
    });
};

Stream.prototype.take = function(n) {
    if (this.empty()) { return this; }
    if (n === 0) { return new Stream(); }
    var me = this;
    return new Stream(
            this.headV,
            function() {
                return me.tail().take(n - 1);
            });
};

Stream.prototype.length = function() {
    var me = this;
    var len = 0;
    while (!me.empty()) {
        ++len;
        me = me.tail();
    }
    return len;
};

Stream.prototype.toArray = function() {
    var ary = [];
    var me = this;
    while (!me.empty()) {
        ary.push(me.extract());
        me = me.tail();
    }
    return ary;
};

Stream.unfold = function(gen, seed) {
    return new Stream(seed, function() {
        return Stream.unfold(gen, gen(seed));
    });
};

// Streams are monads
Stream.of = function(x) { return Stream.repeat(x); };

Stream.prototype.flatten = function() {
    return this.map(function(sx) { return sx.head(); });
};

Stream.prototype.chain = Monad.prototype.chain;

// Streams are comonads
Stream.prototype.extract = Stream.prototype.head;

Stream.prototype.duplicate = function() {
    return this.map(function(x) {
        return new Stream(x);
    });
};

Stream.prototype.extend = Comonad.prototype.extend;
Stream.prototype.evaluate = Comonad.prototype.evaluate;

Stream.fromArray = function (ary) {
    if (ary.length === 0) {
        return new Stream();
    }
    return new Stream(ary[0], function() { return Stream.fromArray(ary.slice(1)); });
};

/***
 * Tape
 *
 * It's like Cursor but for Streams.
 */

function Tape(streamL, focus, streamR) {

    this.focus = (function() { return focus; });

    this.streamL = typeof streamL !== 'undefined'
        ? memothunk(function() { return streamL; })
        : memothunk(function() { return new Stream(); }) ;

    this.streamR = typeof streamR !== 'undefined'
        ? memothunk(function() { return streamR; })
        : memothunk(function() { return new Stream(); }) ;
}

Tape.prototype.map = function(f) {
    var me = this;
    return new Tape(me.streamL().map(f)
                   ,f(me.focus())
                   ,me.streamR().map(f)); } ;

Tape.prototype.force = Functor.prototype.force;
Tape.prototype.delay = Functor.prototype.delay;

Tape.prototype.shiftR = function() {
    var me = this
      , newFocus = me.streamR().extract()
      , newStreamR = me.streamR().tail()
      , newStreamL = new Stream(me.focus(), function() {
          return me.streamL(); })
      ;
    return new Tape(newStreamL, newFocus, newStreamR); };

Tape.prototype.shiftL = function() {
    var me = this
      , newFocus = me.streamL().extract()
      , newStreamL = me.streamL().tail()
      , newStreamR = new Stream(me.focus(), function() {
          return me.streamR(); })
      ;
    return new Tape(newStreamL, newFocus, newStreamR); };

Tape.unfold = function (fl, fc, fr, init) {
    return new Tape(Stream.unfold(fl, init),
                    fc(init),
                    Stream.unfold(fr, init)); };

Tape.iterate = function(li, ri, focus) {
    return Tape.unfold(li, id, ri, focus); };

Tape.prototype.extract = function() {
    return this.focus(); } ;

Tape.prototype.duplicate = function() {
    var me = this;
    return Tape.iterate(function(t) { return t.shiftL(); },
                        function(t) { return t.shiftR(); },
                        me); };

Tape.prototype.extend = Comonad.prototype.extend;
Tape.prototype.evaluate = Comonad.prototype.evaluate;

Tape.prototype.ap = function(wa) {
    var me = this;
    return new Tape(
            me.streamL().ap(wa.streamL()),
            me.extract()(wa.extract()),
            me.streamR().ap(wa.streamR()) ); };

Tape.prototype.insert = function(x) {
    var me = this;
    return new Tape(me.streamL(), x, me.streamR()); } ;

Tape.prototype.slice = function(rangeL, rangeR) {
    var l = this.streamL().take(rangeL).toArray().reverse();
    var r = this.streamR().take(rangeR).toArray();
    return l.concat(this.focus()).concat(r); } ;

/***
 * Store
 */
function Store(f, s) {
    this.lookup = f;
    this.index = memothunk(function() { return s; }); }

Store.prototype.seek = function(s) {
    return new Store(this.lookup, s); } ;

Store.prototype.peek = function(x) {
    return this.lookup(x) ; } ;

Store.prototype.map = function(f) {
    return new Store(compose(f, this.lookup), this.index()); } ;

Store.prototype.force = Functor.prototype.force;
Store.prototype.delay = Functor.prototype.delay;

Store.prototype.extract = function() {
    return this.lookup(this.index()) ; } ;

Store.prototype.duplicate = function() {
    var me = this;
    return new Store(me.lookup,
            new Store(me.lookup, me.index())) ; } ;

Store.prototype.extend = Comonad.prototype.extend;

/***
 * Sink
 *
 * A Sink is an object which can receive an arbitrary number of input values,
 * one at a time over different calls, and then batch-process them all at once
 * using a function you may specify.
 *
 * Example:
 *
 *     function log(x) { console.log(x); }
 *     var s = new Sink(function(xs) { xs.map(log); });
 *     s.send("First");
 *     s.send("Second");
 *     s.extract() <-- will print both values in succession to the console
 */
function Sink(fn) {
    this.fn = fn;
}

Sink.prototype.map = function(f) {
    this.fn = this.fn.map(f);
    return this;
};

Sink.prototype.force = Functor.prototype.force;
Sink.prototype.delay = Functor.prototype.delay;

Sink.prototype.extract = function() {
    return this.fn.extract();
};

Sink.prototype.duplicate = function() {
    this.fn = this.fn.duplicate();
    return this;
};

Sink.prototype.extend = Comonad.prototype.extend;

Sink.prototype.send = function(x) {
    this.fn = this.fn.extend(function(f) {
        return f([x]);
    });
    return this;
};


var exports =
    { 'Monad' : Monad
    , 'Comonad' : Comonad
    , 'IO' : IO
    , 'sequence' : sequence
    , 'fix' : fix
    , 'memothunk' : memothunk
    , 'id' : id
    , 'compose' : compose
    , 'constant' : constant
    , 'Cursor' : Cursor
    , 'Stream' : Stream
    , 'Tape' : Tape
    , 'Array' : Array
    , 'Functor' : Functor
    , 'Pair' : Pair
    , 'Store' : Store
    , 'Y' : Y
    , 'wfix' : wfix
    , 'Function' : Function
    , 'Sink' : Sink
    } ;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = exports;
}
else {
    for (var key in exports) {
        window[key] = exports[key];
    }
}

})();

