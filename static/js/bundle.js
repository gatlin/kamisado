!function(t){function e(r){if(n[r])return n[r].exports;var o=n[r]={exports:{},id:r,loaded:!1};return t[r].call(o.exports,o,o.exports,e),o.loaded=!0,o.exports}var n={};return e.m=t,e.c=n,e.p="",e(0)}([function(t,e){!function(t){function e(r){if(n[r])return n[r].exports;var o=n[r]={exports:{},id:r,loaded:!1};return t[r].call(o.exports,o,o.exports,e),o.loaded=!0,o.exports}var n={};return e.m=t,e.c=n,e.p="",e(0)}([function(t,e,n){var r,o;r=[n,e,n(1),n(4)],o=function(t,e,n,r){"use strict";function o(){var t=8,e=.9*Math.min(window.innerWidth,window.innerHeight-50),n=e/t,r=.9*n/2;return{size:t,boardSide:e,tileSide:n,radius:r}}function i(){var t=[1,2,3,4,5,6,7,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,15,14,13,12,11,10,9];return new r.Board(t,new r.Pos(0,0),"default")}function a(){return window.localStorage.setItem("default",null),i()}function s(){var t=JSON.parse(window.localStorage.getItem("default"));return null===t?i():new r.Board(t.grid,new r.Pos(0,0),t.gameId,t.active,t.player)}function c(t){var e={grid:t.getGrid(),player:t.player,gameId:t.gameId,active:t.active};window.localStorage.setItem("default",JSON.stringify(e))}function u(){var t=o();return{board:s(),geom:t,context:null,resizing:!1,resizeStart:-1}}function l(t,e){if(t.type===f.ResizeStart){t.data.evt;e.resizeStart=Date.now();var n=function(){Date.now()-e.resizeStart<200?window.setTimeout(n,200):(e.resizing=!1,e.board.drawCells(e.context,e.geom))};e.resizing===!1&&(e.resizing=!0,e.geom=o(),window.setTimeout(n,200))}if(t.type===f.CanvasUpdate&&null!==t.data){var i=t.data;e.context=i.getContext("2d")}if(t.type===f.Click){var s=t.data,u=s.target.getBoundingClientRect(),l=s.clientX-u.left,p=s.clientY-u.top,d=new r.Pos(Math.floor(l/e.geom.tileSide),Math.floor(p/e.geom.tileSide));e.board=r.boardClicked(e.board,d),null!==e.board.won&&(e.board=a()),c(e.board)}return t.type===f.Reset&&(e.board=a(),c(e.board)),e.context&&e.board.drawCells(e.context,e.geom),e}function p(t){t.ports.resize_event.recv(function(e){t.actions.send({type:f.ResizeStart,data:{evt:e,updates:t.actions}})}),t.events.click.filter(function(t){return"board_canvas"===t.getId()}).recv(function(e){t.actions.send({type:f.Click,data:e.getRaw()})}),h.recv(function(e){t.actions.send({type:f.CanvasUpdate,data:e})}),t.events.click.filter(function(t){return"reset-btn"===t.getId()}).recv(function(e){t.actions.send({type:f.Reset})})}function d(t){return n.el("div",{class:"container",id:"board"},[n.el("canvas",{id:"board_canvas",width:t.geom.boardSide,height:t.geom.boardSide},[]).subscribe(h),n.el("footer",{class:"footer"},[n.el("div",{class:"container"},[n.el("button",{id:"reset-btn"},["Reset game"]),n.el("p",{},[n.el("a",{href:"https://github.com/gatlin/kamisado/blob/master/README.md"},["How to play and more info available here."])," Made with ",n.el("a",{href:"https://github.com/gatlin/Alm"},["Alm"]),". ",n.el("a",{href:"https://github.com/gatlin/Kamisado"},["Source code on GitHub."])])])])])}var f,h=new n.Mailbox(null);!function(t){t[t.ResizeStart=0]="ResizeStart",t[t.CanvasUpdate=1]="CanvasUpdate",t[t.Click=2]="Click",t[t.Reset=3]="Reset"}(f||(f={}));var v=new n.App({state:u(),update:l,main:p,render:d,eventRoot:"app",domRoot:"app",ports:["resize_event"]}).start();window.addEventListener("resize",function(t){v.ports.resize_event.send(t)},!1)}.apply(e,r),!(void 0!==o&&(t.exports=o))},function(t,e,n){var r,o;r=[n,e,n(2),n(3),n(2),n(3)],o=function(t,e,n,r,o,i){"use strict";function a(t){for(var n in t)e.hasOwnProperty(n)||(e[n]=t[n])}function s(t){for(var e={},n=0;n<t.length;n++){var r=t[n];e[r]=new o.Signal(function(t){return new u(t)})}return e}function c(t){if(Array.isArray(t)){for(var e={},n=0;n<t.length;n++){var r=t[n];e[r]=o.Signal.make()}return e}var i="undefined"==typeof t||null===t?{outbound:[],inbound:[]}:t;for(var a in i){for(var s=i[a],c={},n=0;n<s.length;n++){var r=s[n];c[r]=o.Signal.make()}i[a]=c}return i}a(n),e.el=r.el;var u=function(){function t(t){this.raw=t,this.classes=t.target.className.trim().split(/\s+/g)||[],this.id=t.target.id}return t.prototype.hasClass=function(t){return this.classes.indexOf(t)!==-1},t.prototype.getClasses=function(){return this.classes},t.prototype.getId=function(){return this.id},t.prototype.getValue=function(){return this.raw.target.value},t.prototype.getRaw=function(){return this.raw},t}();e.AlmEvent=u;var l=["click","dblclick","keyup","keydown","keypress","blur","focusout","input","change","load"],p=function(){function t(t){this.gui="undefined"==typeof t.gui||t.gui,this.eventRoot="string"==typeof t.eventRoot?document.getElementById(t.eventRoot):"undefined"==typeof t.eventRoot?document:t.eventRoot,this.domRoot="string"==typeof t.domRoot?document.getElementById(t.domRoot):"undefined"==typeof t.domRoot?document.body:t.domRoot;var e=l.concat("undefined"!=typeof t.extraEvents?t.extraEvents:[]);this.events=s(e),this.ports=c(t.ports);var n=new o.Mailbox(null),r=n.reduce(t.state,function(e,n){return null===e?n:t.update(e,n)});this.scope=Object.seal({events:this.events,ports:this.ports,actions:n,state:r}),t.main(this.scope),this.render=this.gui?t.render:null}return t.prototype.registerEvent=function(t,e){var n=function(t){return e.send(t)};this.eventRoot.addEventListener(t,n,!0)},t.prototype.editScope=function(t){return t(this.scope),this},t.prototype.setEventRoot=function(t){return this.eventRoot="string"==typeof t?document.getElementById(t):t,this},t.prototype.setDomRoot=function(t){return this.domRoot="string"==typeof t?document.getElementById(t):t,this},t.prototype.start=function(){for(var t in this.events){var e=this.events[t];e.numListeners()>0&&this.registerEvent(t,e)}if(this.gui){var n=this.scope.state.map(this.render);i.render(n,this.domRoot)}return{ports:this.scope.ports,state:this.scope.state}},t}();e.App=p}.apply(e,r),!(void 0!==o&&(t.exports=o))},function(t,e,n){var r,o,i=this&&this.__extends||function(t,e){function n(){this.constructor=t}for(var r in e)e.hasOwnProperty(r)&&(t[r]=e[r]);t.prototype=null===e?Object.create(e):(n.prototype=e.prototype,new n)};r=[n,e],o=function(t,e){"use strict";function n(t,e){e.forEach(function(e){Object.getOwnPropertyNames(e.prototype).forEach(function(n){t.prototype[n]=e.prototype[n]})})}function r(t){setTimeout(t,0)}e.derive=n;var o=function(){function t(){}return t.pipe=function(t){for(var e=t[0],n=1;n<t.length;n++)e=e.flatMap(t[n]);return e},t.prototype.flatMap=function(t){return this.map(t).flatten()},t.prototype.pipe=function(t){for(var e=this,n=0;n<t.length;n++)e=e.flatMap(t[n]);return e},t}();e.FlatMap=o,e.async=r;var a=function(){function t(t){this.fn=t,this.listeners=[]}return t.prototype.connect=function(t){return this.listeners.push(t),t},t.make=function(){return new t(function(t){return t})},t.prototype.send=function(t){var e=this.fn(t);if("undefined"!=typeof e)for(var n=0;n<this.listeners.length;n++){var r=this.listeners[n];r.send(e)}},t.prototype.recv=function(e){this.connect(new t(function(t){return e(t)}))},t.prototype.map=function(e){var n=new t(e);return this.connect(n)},t.prototype.filter=function(e){var n=new t(function(t){if(e(t))return t});return this.connect(n)},t.prototype.reduce=function(e,n){var r=e,o=new t(function(t){return r=n(t,r)});return this.connect(o)},t.prototype.numListeners=function(){return this.listeners.length},t}();e.Signal=a;var s=function(t){function e(e){t.call(this,function(t){return t}),this.send(e)}return i(e,t),e.prototype.send=function(e){var n=this;r(function(){t.prototype.send.call(n,e)})},e.prototype.recv=function(e){t.prototype.recv.call(this,e)},e}(a);e.Mailbox=s}.apply(e,r),!(void 0!==o&&(t.exports=o))},function(t,e,n){var r,o;r=[n,e],o=function(t,e){"use strict";function n(t,e,n){var r="undefined"==typeof n?[]:n.map(function(t,e){return"string"==typeof t?new u(t,[],c.Text):t});return new u({tag:t,attrs:e},r,c.Node)}function r(t){if(null===t)return null;if(t.treeType===c.Text)return document.createTextNode(t.content);var e=document.createElement(t.content.tag);for(var n in t.content.attrs)e.setAttribute(n,t.content.attrs[n]);for(var o=0;o<t.children.length;o++){var i=r(t.children[o]);e.appendChild(i)}return null!==t.mailbox&&t.mailbox.send(e),e}function o(t,e){for(var n=t,o=r(e);n.firstChild;)n.removeChild(n.firstChild);n.appendChild(o)}function i(t,e,n){if(!t.length)return e.map(function(t){return[l.Insert,null,t]});if(!e.length)return t.map(function(t){return[l.Delete,t,null]});for(var r=t.length+1,o=e.length+1,i=new Array(r*o),a=[],s=0;s<r;s++)i[s*o]=s;for(var c=0;c<o;c++)i[c]=c;for(var u=1;u<o;u++)for(var p=1;p<r;p++)n(t[p-1],e[u-1])?i[p*o+u]=i[(p-1)*o+(u-1)]:i[p*o+u]=Math.min(i[(p-1)*o+u],i[p*o+(u-1)])+1;for(var d=r-1,f=o-1;0!==d||0!==f;)n(t[d-1],e[f-1])?(d--,f--,a.unshift([l.Merge,t[d],e[f]])):i[d*o+(f-1)]<=i[(d-1)*o+f]?(f--,a.unshift([l.Insert,null,e[f]])):(d--,a.unshift([l.Delete,t[d],null]));return a}function a(t,e,n,o){if(void 0===o&&(o=0),"undefined"==typeof n||null===n)return void t.removeChild(t.childNodes[o]);if("undefined"==typeof e||null===e)return void t.insertBefore(r(n),t.childNodes[o]);if(n.treeType===c.Node){if(e.treeType===c.Node&&e.content.tag===n.content.tag){var s=t.childNodes[o];for(var u in e.content.attrs)u in n.content.attrs||(s.removeAttribute(u),delete s[u]);for(var u in n.content.attrs){var p=n.content.attrs[u];u in e.content.attrs&&p===e.content.attrs[u]||(s[u]=p,s.setAttribute(u,p))}for(var d=i(e.children,n.children,function(t,e){return"undefined"!=typeof t&&t.eq(e)}),f=0,h=0;h<d.length;h++){var v=d[h];a(t.childNodes[o],v[1],v[2],f),v[0]!==l.Delete&&f++}}}else t.replaceChild(r(n),t.childNodes[o])}function s(t,e){t.reduce(null,function(t,n){return null===n?o(e,t):a(e,n,t),t})}e.el=n;var c;!function(t){t[t.Text=0]="Text",t[t.Node=1]="Node"}(c||(c={}));var u=function(){function t(t,e,n){this.content=t,this.children=e,this.treeType=n,this.mailbox=null,n===c.Node?"key"in this.content.attrs?(this.key=this.content.attrs.key,delete this.content.attrs.key):"id"in this.content.attrs?this.key=this.content.attrs.id:this.key=this.content.tag:this.key="text-node"}return t.prototype.subscribe=function(t){return this.mailbox=t,this},t.prototype.eq=function(t){return!!t&&this.key===t.key},t}();e.VTree=u;var l;!function(t){t[t.Merge=0]="Merge",t[t.Delete=1]="Delete",t[t.Insert=2]="Insert"}(l||(l={})),e.diff_array=i,e.diff_dom=a,e.render=s}.apply(e,r),!(void 0!==o&&(t.exports=o))},function(t,e,n){var r,o;r=[n,e],o=function(t,e){"use strict";function n(t){return(t.player?t.active.y>t.pos.y:t.active.y<t.pos.y)&&0===t.extract()&&(Math.abs(t.active.x-t.pos.x)===Math.abs(t.active.y-t.pos.y)||t.active.x-t.pos.x===0)&&t.emptyPath(t.active,t.pos)}function r(t,e){return function(n){var r=e.tileSide,o=e.size,s=e.radius,c=n.extract(),u=i[a[n.pos.y][n.pos.x]];if(t.fillStyle=u,t.fillRect(n.pos.x*r,n.pos.y*r,r,r),0===c)return c;var l=n.pos.x+1,p=n.pos.y+1,d={x:l*r-r/2,y:p*r-r/2},f=c>o?i[9]:i[8],h=i[(c-1)%8];return t.beginPath(),t.arc(d.x,d.y,s,0,2*Math.PI,!1),t.closePath(),t.fillStyle=f,t.fill(),t.strokeStyle=f,t.stroke(),t.beginPath(),t.arc(d.x,d.y,.75*s,0,2*Math.PI,!1),t.closePath(),t.fillStyle=h,t.fill(),t.strokeStyle=h,t.stroke(),null!==n.active&&n.active.x===n.pos.x&&n.active.y===n.pos.y&&(t.beginPath(),t.arc(d.x,d.y,.5*s,0,2*Math.PI,!1),t.fillStyle=f,t.fill(),t.strokeStyle=f,t.stroke()),c}}function o(t,e){var r=t.setPos(e).extract();if(null===t.active&&(t.active=new s(-1,-1)),t.active.x===t.pos.x&&t.active.y===t.pos.y)return t.player=t.player?0:1,t.selectNextPiece();if(r>0&&(t.active.x=t.pos.x,t.active.y=t.pos.y),0===r){if(!n(t))return t;if(t=t.gridSet(t.pos.x,t.pos.y,t.gridGet(t.active.x,t.active.y)),t=t.gridSet(t.active.x,t.active.y,0),t.active=t.pos,!t.player&&7===t.pos.y||t.player&&0===t.pos.y)return t.won=t.pos.y?1:0,console.log("WINNER"),t;t.player=t.player?0:1}return t.selectNextPiece()}var i=["#F5B437","#3340AE","#1E8AD1","#F8D6C4","#F6E500","#DC442F","#BAD360","#6B451E","#080D07","#F4FFF4"],a=[[0,1,2,3,4,5,6,7],[5,0,3,6,1,4,7,2],[6,3,0,5,2,7,4,1],[3,2,1,0,7,6,5,4],[4,5,6,7,0,1,2,3],[1,4,7,2,5,0,3,6],[2,7,4,1,6,3,0,5],[7,6,5,4,3,2,1,0]],s=function(){function t(t,e){this.x=t,this.y=e}return t}();e.Pos=s;var c=function(){function t(t,e,n,r,o){void 0===r&&(r=null),void 0===o&&(o=0),this.grid=t,this.pos=e,this.gameId=n,this.player=o,this.won=null,this.active=r}return t.prototype.getGrid=function(){return this.grid},t.prototype.setPos=function(t){return this.pos=t,this},t.prototype.extract=function(){return this.grid[8*this.pos.y+this.pos.x]},t.prototype.duplicate=function(){var e,n,r=this.grid,o=new Array(64);for(n=0;n<8;n++)for(e=0;e<8;e++)o[8*n+e]=new t(r,new s(e,n),this.gameId,this.active,this.player);return new t(o,this.pos,this.gameId,this.active,this.player)},t.prototype.map=function(t){var e,n,r=[];for(n=0;n<8;n++)for(e=0;e<8;e++)r[8*n+e]=t(this.grid[8*n+e]);return this},t.prototype.convolve=function(t){return this.duplicate().map(t)},t.prototype.selectNextPiece=function(){var t,e,n,r=a[this.active.y][this.active.x],o=r+1+8*this.player;for(e=0;e<8;e++)for(t=0;t<8;t++)if(n=this.grid[8*e+t],n===o){this.active.x=t,this.active.y=e;break}return this},t.prototype.emptyPath=function(t,e){for(var n=e.x-t.x,r=e.y-t.y,o=n?Math.abs(n)/n:0,i=Math.abs(r)/r,a=!0,s=t.x+o,c=t.y+i;c!==e.y&&a;)this.grid[8*c+s]&&(a=!1),c+=i,s+=o;return a},t.prototype.drawCells=function(t,e){this.convolve(r(t,e))},t.prototype.gridGet=function(t,e){return this.grid[8*e+t]},t.prototype.gridSet=function(t,e,n){return this.grid[8*e+t]=n,this},t}();e.Board=c,e.boardClicked=o}.apply(e,r),!(void 0!==o&&(t.exports=o))}])}]);