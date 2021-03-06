#!/usr/bin/env node
var debug = require('debug')('node_chat');
var app = require('./app');
var cluster = require('cluster');
var numCPUs = require('os').cpus().length;

//启动多个进程只是为了充分将CPU资源利用起来，并不是为了解决并发问题
//解决并发问题的关键在于解决单线程问题，如何突破多线程.
//这有部分原因在于：线程的内存消耗远小于进程。（这句话的描述好像有点问题）

app.set('port', process.env.PORT || 3000);

var server = app.listen(app.get('port'), function() {
  debug('node_chat server listening on port ' + server.address().port);
});

require('./chat').listen(server);