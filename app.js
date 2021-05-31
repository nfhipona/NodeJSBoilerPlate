'use strict';

                    require(__dirname + '/lib/prototype.js'); // load prototypes

const config        = require(__dirname + '/config/config.js');
const database      = require(__dirname + '/lib/database.js');
const router        = require(__dirname + '/lib/router_main.js');
const resource      = require(__dirname + '/lib/router_resource.js');
const authJS        = require(__dirname + '/lib/auth.js'); // Auth - access token
const cors          = require(__dirname + '/lib/cors.js');
const redisClient   = require(__dirname + '/lib/redis.js');
const pjson         = require(__dirname + '/package.json');

const morgan        = require('morgan');
const express       = require('express');

module.exports = prepareApp();

function prepareApp() {
    const app       = express();
    const auth      = authJS(redisClient);

    // setup middlewares
    app.use(express.json()) // for parsing application/json
    app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
    app.use(morgan('dev'));
    app.use(express.static('.'));
    app.use(cors(config.cors));

    /**
     * @api {get} / Server information
     * @apiName GetServerInfo
     * @apiGroup Server
     */
    app.get('/', (req, res) => {
        res.status(200)
        .json({
            version: pjson.version,
            message: 'Welcome to boilerplate API',
            docs: 'https://documenter.getpostman.com/view/3554620/Szt5eVtE'
        });
    });
    
    // handles unknown routes
    app.all('*', (req, res, next) => {
        if (req.method !== 'OPTIONS') {
            res.status(200)
               .json({ message: 'Nothing to do here.' });
            return
        }
        next();
    });

    // :-- configure api
    const v1api       = express();
    router(v1api, database, auth);
    resource(v1api, database, auth);
    app.use('/api/v1/', v1api);

    return app;
}