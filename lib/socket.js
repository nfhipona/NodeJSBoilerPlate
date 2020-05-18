'use strict';

//const config    = require(__dirname + '/../config/config.js');

module.exports = (io, auth) => {

    io.origins((origin, next) => {

        console.log('Entered Socket IO setup.');
        next('Entered Socket IO setup.', true);
    });

    io.use((socket, next) => {

        let query = socket.handshake.query;
        let token = query.token;

        if (!token) {
            return next(new Error('Missing token.'));
        }

        /*auth.validate(token, (err, decoded) => {

            if (!decoded) {
                console.log('Invalid token Socket ID: ' + `${socket.id}` + ' --- ' + `${token}`);
				return next(new Error('Invalid token'));
            }

            console.log('Socket ID: ' + socket.id + '\ntoken: ', decoded);
            next();
        });*/

        next();

    });

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

};
