!function(t){function e(r){if(n[r])return n[r].exports;var o=n[r]={exports:{},id:r,loaded:!1};return t[r].call(o.exports,o,o.exports,e),o.loaded=!0,o.exports}var n={};return e.m=t,e.c=n,e.p="",e(0)}([function(t,e){!function(t){function e(r){if(n[r])return n[r].exports;var o=n[r]={exports:{},id:r,loaded:!1};return t[r].call(o.exports,o,o.exports,e),o.loaded=!0,o.exports}var n={};return e.m=t,e.c=n,e.p="",e(0)}([function(t,e,n){var r,o;r=[n,e,n(1),n(6)],o=function(t,e,n,r){"use strict";var o=n.kamisadoApp.start(),i=new r.KamisadoAI(1);window.addEventListener("resize",function(t){o.ports.inbound.resize.send(t)},!1),o.ports.outbound.moves.recv(function(t){var e=i.nextMove(t);e&&o.ports.inbound.moves.send(e)})}.apply(e,r),!(void 0!==o&&(t.exports=o))},function(t,e,n){var r,o;r=[n,e,n(2),n(5)],o=function(t,e,n,r){"use strict";function o(){var t,e=Math.min(window.innerWidth,window.innerHeight-50);t=e>=480?.75*e:.95*e,t<480&&(t=window.innerWidth);var n=t/8,r=.9*n/2;return{boardSide:t,tileSide:n,radius:r}}function i(){return r.Board.fresh()}function s(){return window.localStorage.setItem("default",null),i()}function a(){var t=window.localStorage.getItem("default");if(!t)return i();var e=JSON.parse(t);return e?new r.Board(e.grid,new r.Pos(0,0),e.gameId,null!==e.active?new r.Pos(e.active.x,e.active.y):null,e.player):void s()}function u(t){var e=null!==t.active?{x:t.active.x,y:t.active.y}:null,n={grid:t.getGrid(),player:t.player,gameId:t.gameId,active:e};window.localStorage.setItem("default",JSON.stringify(n))}function c(){return{board:a(),geom:o(),context:null,resizing:!1,resizeStart:-1,move_number:0,last_move:null,current_player:0,i_am:1}}function l(t,e){if(t.type===f.ResizeStart){t.data.evt;e.resizeStart=Date.now();var n=function(){Date.now()-e.resizeStart<200?window.setTimeout(n,200):(e.resizing=!1,e.board=r.drawCells(e.board,e.context,e.geom))};e.resizing===!1&&(e.resizing=!0,e.geom=o(),window.setTimeout(n,200))}if(t.type===f.CanvasUpdate&&null!==t.data){var i=t.data;e.context=i.getContext("2d")}if(t.type===f.UserMove){var a=t.data,c=a.target.getBoundingClientRect(),l=a.clientX-c.left,p=a.clientY-c.top,d=null!==e.board.active?e.board.active.clone():null,v=new r.Pos(Math.floor(l/e.geom.tileSide),Math.floor(p/e.geom.tileSide)),h=v.clone(),y=r.movePiece(e.board,v);(y||d.equals(h))&&(e.move_number=e.move_number+1,e.current_player=(e.current_player+1)%2,e.last_move={src:d,dst:h},null!==e.board.won&&(e.board=s())),u(e.board)}if(t.type===f.RemoteMove){var y=r.movePiece(e.board,t.data.clone());y&&(e.current_player=(e.current_player+1)%2,null!==e.board.won&&console.log("computer won!")),u(e.board)}return t.type===f.Reset&&(e.board=s(),u(e.board)),e.context&&(e.board=r.drawCells(e.board,e.context,e.geom)),e}function p(t){t.ports.inbound.resize.recv(function(e){t.actions.send({type:f.ResizeStart,data:{evt:e,updates:t.actions}})}),t.ports.inbound.moves.recv(function(e){t.actions.send({type:f.RemoteMove,data:e})}),t.events.click.filter(function(t){return"board_canvas"===t.getId()}).recv(function(e){e.getRaw();t.actions.send({type:f.UserMove,data:e.getRaw()})}),v.recv(function(e){t.actions.send({type:f.CanvasUpdate,data:e})}),t.events.click.filter(function(t){return"reset-btn"===t.getId()}).recv(function(e){t.actions.send({type:f.Reset})}),t.state.reduce(0,function(e,n){return e.move_number>n&&t.ports.outbound.moves.send(e.board),e.move_number})}function d(t){return n.el("div",{class:"container",id:"board"},[n.el("canvas",{id:"board_canvas",width:t.geom.boardSide,height:t.geom.boardSide},[]).subscribe(v),n.el("footer",{class:"footer"},[n.el("div",{class:"container"},[n.el("button",{id:"reset-btn"},["Reset game"])])])])}var f,v=new n.Mailbox(null);!function(t){t[t.ResizeStart=0]="ResizeStart",t[t.CanvasUpdate=1]="CanvasUpdate",t[t.UserMove=2]="UserMove",t[t.Reset=3]="Reset",t[t.RemoteMove=4]="RemoteMove"}(f||(f={})),e.kamisadoApp=new n.App({state:c(),update:l,main:p,render:d,eventRoot:"kamisado-game",domRoot:"kamisado-game",ports:{inbound:["resize","moves"],outbound:["moves"]}})}.apply(e,r),!(void 0!==o&&(t.exports=o))},function(t,e,n){var r,o;r=[n,e,n(3),n(4),n(3),n(4)],o=function(t,e,n,r,o,i){"use strict";function s(t){for(var n in t)e.hasOwnProperty(n)||(e[n]=t[n])}function a(t){for(var e={},n=0;n<t.length;n++){var r=t[n];e[r]=new o.Signal(function(t){return new c(t)})}return e}function u(t){if(Array.isArray(t)){for(var e={},n=0;n<t.length;n++){var r=t[n];e[r]=o.Signal.make()}return e}var i="undefined"==typeof t||null===t?{outbound:[],inbound:[]}:t;for(var s in i){for(var a=i[s],u={},n=0;n<a.length;n++){var r=a[n];u[r]=o.Signal.make()}i[s]=u}return i}s(n),e.el=r.el;var c=function(){function t(t){this.raw=t,this.classes=t.target.className.trim().split(/\s+/g)||[],this.id=t.target.id}return t.prototype.hasClass=function(t){return this.classes.indexOf(t)!==-1},t.prototype.getClasses=function(){return this.classes},t.prototype.getId=function(){return this.id},t.prototype.getValue=function(){return this.raw.target.value},t.prototype.getRaw=function(){return this.raw},t}();e.AlmEvent=c;var l=["click","dblclick","keyup","keydown","keypress","blur","focusout","input","change","load"],p=function(){function t(t){this.gui="undefined"==typeof t.gui||t.gui,this.eventRoot="string"==typeof t.eventRoot?document.getElementById(t.eventRoot):"undefined"==typeof t.eventRoot?document:t.eventRoot,this.domRoot="string"==typeof t.domRoot?document.getElementById(t.domRoot):"undefined"==typeof t.domRoot?document.body:t.domRoot;var e=l.concat("undefined"!=typeof t.extraEvents?t.extraEvents:[]);this.events=a(e),this.ports=u(t.ports);var n=new o.Mailbox(null),r=n.reduce(t.state,function(e,n){return null===e?n:t.update(e,n)});this.scope=Object.seal({events:this.events,ports:this.ports,actions:n,state:r}),t.main(this.scope),this.render=this.gui?t.render:null}return t.prototype.registerEvent=function(t,e){var n=function(t){return e.send(t)};this.eventRoot.addEventListener(t,n,!0)},t.prototype.editScope=function(t){return t(this.scope),this},t.prototype.setEventRoot=function(t){return this.eventRoot="string"==typeof t?document.getElementById(t):t,this},t.prototype.setDomRoot=function(t){return this.domRoot="string"==typeof t?document.getElementById(t):t,this},t.prototype.start=function(){for(var t in this.events){var e=this.events[t];e.numListeners()>0&&this.registerEvent(t,e)}if(this.gui){var n=this.scope.state.map(this.render);i.render(n,this.domRoot)}return{ports:this.scope.ports,state:this.scope.state}},t}();e.App=p}.apply(e,r),!(void 0!==o&&(t.exports=o))},function(t,e,n){var r,o,i=this&&this.__extends||function(t,e){function n(){this.constructor=t}for(var r in e)e.hasOwnProperty(r)&&(t[r]=e[r]);t.prototype=null===e?Object.create(e):(n.prototype=e.prototype,new n)};r=[n,e],o=function(t,e){"use strict";function n(t,e){e.forEach(function(e){Object.getOwnPropertyNames(e.prototype).forEach(function(n){t.prototype[n]=e.prototype[n]})})}function r(t){setTimeout(t,0)}e.derive=n;var o=function(){function t(){}return t.pipe=function(t){for(var e=t[0],n=1;n<t.length;n++)e=e.flatMap(t[n]);return e},t.prototype.flatMap=function(t){return this.map(t).flatten()},t.prototype.pipe=function(t){for(var e=this,n=0;n<t.length;n++)e=e.flatMap(t[n]);return e},t}();e.FlatMap=o,e.async=r;var s=function(){function t(t){this.fn=t,this.listeners=[]}return t.prototype.connect=function(t){return this.listeners.push(t),t},t.make=function(){return new t(function(t){return t})},t.prototype.send=function(t){var e=this.fn(t);if("undefined"!=typeof e)for(var n=0;n<this.listeners.length;n++){var r=this.listeners[n];r.send(e)}},t.prototype.recv=function(e){this.connect(new t(function(t){return e(t)}))},t.prototype.map=function(e){var n=new t(e);return this.connect(n)},t.prototype.filter=function(e){var n=new t(function(t){if(e(t))return t});return this.connect(n)},t.prototype.reduce=function(e,n){var r=e,o=new t(function(t){return r=n(t,r)});return this.connect(o)},t.prototype.numListeners=function(){return this.listeners.length},t}();e.Signal=s;var a=function(t){function e(e){t.call(this,function(t){return t}),this.send(e)}return i(e,t),e.prototype.send=function(e){var n=this;r(function(){t.prototype.send.call(n,e)})},e.prototype.recv=function(e){t.prototype.recv.call(this,e)},e}(s);e.Mailbox=a}.apply(e,r),!(void 0!==o&&(t.exports=o))},function(t,e,n){var r,o;r=[n,e],o=function(t,e){"use strict";function n(t,e,n){var r="undefined"==typeof n?[]:n.map(function(t,e){return"string"==typeof t?new c(t,[],u.Text):t});return new c({tag:t,attrs:e},r,u.Node)}function r(t){if(null===t)return null;if(t.treeType===u.Text)return document.createTextNode(t.content);var e=document.createElement(t.content.tag);for(var n in t.content.attrs)e.setAttribute(n,t.content.attrs[n]);for(var o=0;o<t.children.length;o++){var i=r(t.children[o]);e.appendChild(i)}return null!==t.mailbox&&t.mailbox.send(e),e}function o(t,e){for(var n=t,o=r(e);n.firstChild;)n.removeChild(n.firstChild);n.appendChild(o)}function i(t,e,n){if(!t.length)return e.map(function(t){return[l.Insert,null,t]});if(!e.length)return t.map(function(t){return[l.Delete,t,null]});for(var r=t.length+1,o=e.length+1,i=new Array(r*o),s=[],a=0;a<r;a++)i[a*o]=a;for(var u=0;u<o;u++)i[u]=u;for(var c=1;c<o;c++)for(var p=1;p<r;p++)n(t[p-1],e[c-1])?i[p*o+c]=i[(p-1)*o+(c-1)]:i[p*o+c]=Math.min(i[(p-1)*o+c],i[p*o+(c-1)])+1;for(var d=r-1,f=o-1;0!==d||0!==f;)n(t[d-1],e[f-1])?(d--,f--,s.unshift([l.Merge,t[d],e[f]])):i[d*o+(f-1)]<=i[(d-1)*o+f]?(f--,s.unshift([l.Insert,null,e[f]])):(d--,s.unshift([l.Delete,t[d],null]));return s}function s(t,e,n,o){if(void 0===o&&(o=0),"undefined"==typeof n||null===n)return void t.removeChild(t.childNodes[o]);if("undefined"==typeof e||null===e)return void t.insertBefore(r(n),t.childNodes[o]);if(n.treeType===u.Node){if(e.treeType===u.Node&&e.content.tag===n.content.tag){var a=t.childNodes[o];for(var c in e.content.attrs)c in n.content.attrs||(a.removeAttribute(c),delete a[c]);for(var c in n.content.attrs){var p=n.content.attrs[c];c in e.content.attrs&&p===e.content.attrs[c]||(a[c]=p,a.setAttribute(c,p))}for(var d=i(e.children,n.children,function(t,e){return"undefined"!=typeof t&&t.eq(e)}),f=0,v=0;v<d.length;v++){var h=d[v];s(t.childNodes[o],h[1],h[2],f),h[0]!==l.Delete&&f++}}}else t.replaceChild(r(n),t.childNodes[o])}function a(t,e){t.reduce(null,function(t,n){return null===n?o(e,t):s(e,n,t),t})}e.el=n;var u;!function(t){t[t.Text=0]="Text",t[t.Node=1]="Node"}(u||(u={}));var c=function(){function t(t,e,n){this.content=t,this.children=e,this.treeType=n,this.mailbox=null,n===u.Node?"key"in this.content.attrs?(this.key=this.content.attrs.key,delete this.content.attrs.key):"id"in this.content.attrs?this.key=this.content.attrs.id:this.key=this.content.tag:this.key="text-node"}return t.prototype.subscribe=function(t){return this.mailbox=t,this},t.prototype.eq=function(t){return!!t&&this.key===t.key},t}();e.VTree=c;var l;!function(t){t[t.Merge=0]="Merge",t[t.Delete=1]="Delete",t[t.Insert=2]="Insert"}(l||(l={})),e.diff_array=i,e.diff_dom=s,e.render=a}.apply(e,r),!(void 0!==o&&(t.exports=o))},function(t,e,n){var r,o;r=[n,e],o=function(t,e){"use strict";function n(t){return(t.player?t.active.y<t.pos.y:t.active.y>t.pos.y)&&0===t.extract()&&(Math.abs(t.active.x-t.pos.x)===Math.abs(t.active.y-t.pos.y)||t.active.x-t.pos.x===0)&&t.emptyPath(t.active,t.pos)}function r(t,e,n){return t.convolve(o(e,n))}function o(t,n){return function(r){var o=n.tileSide,i=n.radius,s=r.extract(),a=e.colors[e.tileColorPattern[r.pos.y][r.pos.x]];if(t.fillStyle=a,t.fillRect(r.pos.x*o,r.pos.y*o,o,o),0===s)return s;var u=r.pos.x+1,c=r.pos.y+1,l={x:u*o-o/2,y:c*o-o/2},p=s>8?e.colors[9]:e.colors[8],d=e.colors[(s-1)%8];return t.beginPath(),t.arc(l.x,l.y,i,0,2*Math.PI,!1),t.closePath(),t.fillStyle=p,t.fill(),t.strokeStyle=p,t.stroke(),t.beginPath(),t.arc(l.x,l.y,.75*i,0,2*Math.PI,!1),t.closePath(),t.fillStyle=d,t.fill(),t.strokeStyle=d,t.stroke(),null!==r.active&&r.active.x===r.pos.x&&r.active.y===r.pos.y&&(t.beginPath(),t.arc(l.x,l.y,.5*i,0,2*Math.PI,!1),t.fillStyle=p,t.fill(),t.strokeStyle=p,t.stroke()),s}}function i(t,e){var r=t.setPos(e).extract();if(null===t.active&&(t.active=new s(-1,-1)),t.active.equals(t.pos))return t.player=t.player?0:1,t=t.selectNextPiece(),!1;if(r>0&&t.active.becomes(t.pos),0===r){if(!n(t))return!1;if(t=t.gridSet(t.pos.x,t.pos.y,t.gridGet(t.active.x,t.active.y)),t=t.gridSet(t.active.x,t.active.y,0),t.active.becomes(t.pos),!t.player&&0===t.pos.y||t.player&&7===t.pos.y)return t.won=t.pos.y?1:0,!0;t.player=t.player?0:1}return t=t.selectNextPiece(),!0}e.colors=["#F5B437","#3340AE","#1E8AD1","#F8D6C4","#F6E500","#DC442F","#BAD360","#6B451E","#080D07","#F4FFF4"],e.tileColorPattern=[[0,1,2,3,4,5,6,7],[5,0,3,6,1,4,7,2],[6,3,0,5,2,7,4,1],[3,2,1,0,7,6,5,4],[4,5,6,7,0,1,2,3],[1,4,7,2,5,0,3,6],[2,7,4,1,6,3,0,5],[7,6,5,4,3,2,1,0]];var s=function(){function t(t,e){this.x=t,this.y=e}return t.prototype.equals=function(t){return this.x===t.x&&this.y===t.y},t.prototype.becomes=function(t){return this.x=JSON.parse(JSON.stringify(t.x)),this.y=JSON.parse(JSON.stringify(t.y)),this},t.prototype.clone=function(){return new t(JSON.parse(JSON.stringify(this.x)),JSON.parse(JSON.stringify(this.y)))},t}();e.Pos=s;var a=function(){function t(t,e,n,r,o){void 0===r&&(r=null),void 0===o&&(o=0),this.grid=t,this.pos=e,this.gameId=n,this.player=o,this.won=null,this.active=r}return t.fresh=function(){var e=[9,10,11,12,13,14,15,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,7,6,5,4,3,2,1];return new t(e,new s(0,0),"default")},t.prototype.getGrid=function(){return JSON.parse(JSON.stringify(this.grid))},t.prototype.setPos=function(t){return this.pos=t,this},t.prototype.extract=function(){return this.grid[8*this.pos.y+this.pos.x]},t.prototype.duplicate=function(){var e,n,r=this.grid,o=new Array(64);for(n=0;n<8;n++)for(e=0;e<8;e++)o[8*n+e]=new t(r,new s(e,n),this.gameId,this.active,this.player);return new t(o,this.pos,this.gameId,this.active,this.player)},t.prototype.map=function(e){return new t(this.grid.map(e),this.pos,this.gameId,this.active,this.player)},t.prototype.convolve=function(e){var n,r,o=this.grid,i=new Array(64);for(r=0;r<8;r++)for(n=0;n<8;n++)i[8*r+n]=new t(o,new s(n,r),this.gameId,this.active,this.player);return new t(i.map(e),this.pos,this.gameId,this.active,this.player)},t.prototype.selectNextPiece=function(){var t,n,r,o=e.tileColorPattern[this.active.y][this.active.x],i=o+1+8*this.player;for(n=0;n<8;n++)for(t=0;t<8;t++)if(r=this.grid[8*n+t],r===i){this.active.x=t,this.active.y=n;break}return this},t.prototype.emptyPath=function(t,e){for(var n=e.x-t.x,r=e.y-t.y,o=n?Math.abs(n)/n:0,i=Math.abs(r)/r,s=!0,a=t.x+o,u=t.y+i;u!==e.y&&s;)this.grid[8*u+a]&&(s=!1),u+=i,a+=o;return s},t.prototype.gridGet=function(t,e){return this.grid[8*e+t]},t.prototype.gridSet=function(t,e,n){return this.grid[8*e+t]=n,this},t}();e.Board=a,e.drawCells=r,e.movePiece=i}.apply(e,r),!(void 0!==o&&(t.exports=o))},function(t,e,n){var r,o;r=[n,e,n(5)],o=function(t,e,n){"use strict";var r=function(){function t(t){this.whoAmI=t}return t.prototype.getMoves=function(t,e,n,r){void 0===r&&(r=null);for(var o=[],i=n?1:-1,s=0,a=[1,0,-1];s<a.length;s++)for(var u=a[s],c=i,l=u,p=void 0,d=!1;!d;){p=e.clone(),p.x+=l,p.y+=c;var f=null!==r&&p.equals(r);p.y>7||p.y<0||p.x>7||p.x<0||t.gridGet(p.x,p.y)&&!f?d=!0:(o.push(p),c+=i,l+=u)}return o},t.prototype.findPiece=function(t,e){var r,o,i;for(o=0;o<8;o++)for(r=0;r<8;r++)if(i=t.gridGet(r,o),i===e)return new n.Pos(r,o);return null},t.prototype.nextMove=function(t){if(t.player!==this.whoAmI)return null;var e=(this.whoAmI+1)%2,r=this.whoAmI?7:0,o=this.whoAmI?0:7,i=this.getMoves(t,t.active,this.whoAmI,null);console.log("myMoves length",i.length);for(var s={},a={},u=1e4,c=null,l=0,p=i;l<p.length;l++){var d=p[l];if(d.y===r)return d;var f=n.tileColorPattern[d.y][d.x],v=f+1+8*e;if(v in s?s[v].push(d):s[v]=[d],!(v in a)){var h=this.findPiece(t,v),y=this.getMoves(t,h,e,t.active);a[v]=y;for(var g=0,m=0,x=y;m<x.length;m++){var w=x[m];w.y===o&&(console.log("piece "+v+" can win"),g+=25)}var b=g+y.length;console.log("piece "+v+" score: "+b),b<u&&(u=b,c=v)}}console.log("lowest scoring piece",c),console.log("lowest score",u);var S=s[c].length;return s[c][Math.floor(Math.random()*S)]},t}();e.KamisadoAI=r}.apply(e,r),!(void 0!==o&&(t.exports=o))}])}]);