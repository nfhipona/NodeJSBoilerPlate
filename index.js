'use strict';

                    require(__dirname + '/lib/prototype.js'); // load prototypes

const cluster       = require("cluster");
const http          = require('http');
const https         = require('https');
const numCPUs       = require('os').cpus().length;

const app           = require(__dirname + '/app.js');
const socketJS      = require(__dirname + '/lib/socket.js');
const config        = require(__dirname + '/config/config.js');
const pjson         = require(__dirname + '/package.json');

const serverConf    = config.serverConfig;
const redisConf     = config.redisConfig;
const cert          = config.certificate;
const hasSSLCert    = (cert.key && cert.file);

// setup clusters
if (cluster.isMaster) {
    console.log(`\nMaster ${process.pid} is running`);

    // create clusters based on number of available threads
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    // on cluster exit - restart
    cluster.on("exit", (worker) => {
        console.log(`Worker ${worker.process.pid} died`);
        cluster.fork(); // restart
    });
}else{
    console.log(`Worker ${process.pid} started`);

    // setup server
    const httpServer = hasSSLCert ? https.createServer(cert, app) : http.createServer(app);

    socketJS(httpServer, redisConf);

    httpServer.listen(process.env.PORT || serverConf.port, () => {
        if (cluster.isMaster) {
            console.log(
                `\nApp Version: ${pjson.version}\nNumber of CPU: ${numCPUs}\nRunning on ${hasSSLCert ? 'https' : 'http'} connection\nListening on port: ${serverConf.port}\n`
            );
        }
    });
}