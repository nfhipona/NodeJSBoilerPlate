'use strict';

const { Server }        = require("socket.io");
const { createClient }  = require('redis');
const redisAdapter      = require('@socket.io/redis-adapter');

module.exports = (httpServer, redisConf) => {
    const pubClient = createClient(redisConf);
    const subClient = pubClient.duplicate();
    const adapter   = redisAdapter(pubClient, subClient);
    const io        = new Server(httpServer);
    
    io.adapter(adapter);

    io.on('connection', (socket) => {
        console.log('Socket connected: ' + `${socket.id}`);

		socket.emit('status', 'Socket server is ready.');
		io.emit('status', 'Socket connected: ' + `${socket.id}`);

        socket.on('error', (err) => {
            console.log('error: ', err);
        });

        socket.on('disconnect', (reason) => {
            let message = `${socket.id}` + ' has disconnected \n\t--- reason: ' + `${reason}`;

            console.log(message);
			io.emit('status', message);
        });

        socket.on('message', (msg) => {
            console.log('Receive msg from: ' + `${socket.id}` + '\ncontent: ' + msg);
            io.emit('message', { from: socket.id, message: msg });
        });
    });
}