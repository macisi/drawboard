/**
 * @author: biangang
 * @date: 2014/6/13
 */
var router = require('koa-router');
var less = require('koa-less');
var serve = require('koa-static');
var koa = require('koa');
var views = require('koa-views');
var app = koa();

app.use(views(__dirname + '/template', {
    default: 'jade'
}));

app.use(less(__dirname + '/public', {
    //todo: public env set once true
    once: false,
    compiler: {
        compress: true,
        sourceMap: true
    }
}));
app.use(serve(__dirname + '/public'));

app.use(router(app));

app.get('/', function *(next){
    yield this.render('index');
});


var server = require('http').Server(app.callback());
var io = require('socket.io')(server);

io.of('/draw').on('connection', function(socket){
    socket.on('sendDrawData',  function(data){
        socket.broadcast.emit('getDrawData', data);
    });
    socket.on('onSyncStatus', function(data){
        socket.broadcast.emit('syncStatus', data);
    });
    socket.on('onSyncSize', function(data){
        socket.broadcast.emit('syncSize', data);
    });
});

server.listen(3000);