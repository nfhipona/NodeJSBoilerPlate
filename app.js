'use strict';

                    require(__dirname + '/lib/prototype.js'); // load prototypes

const config        = require(__dirname + '/config/config.js');
const c             = require(__dirname + '/config/constant.js');
const database      = require(__dirname + '/lib/database.js');
const router        = require(__dirname + '/lib/router_main.js');
const resource      = require(__dirname + '/lib/router_resource.js');
const authJS        = require(__dirname + '/lib/auth.js'); // Auth - access token
const cors          = require(__dirname + '/lib/cors.js');
const redisClient   = require(__dirname + '/lib/redis.js');
const helper        = require(__dirname + '/helper/helper.js');
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

    // :-- configure api
    
    const v1api       = express();
    router(v1api, database, auth);
    resource(v1api, database, auth);
    app.use('/v1/', v1api);

    // :-- configure api

    /**
     * @api {get} / Server information
     * @apiName GetServerInfo
     * @apiGroup Server
     */
    app.get('/', (req, res) => {
        const welcomeMsg = {
            version: pjson.version,
            message: `Welcome to ${pjson.app_name} API`,
            docs: pjson.api_docs
        };
        helper.send(200)(null, res, welcomeMsg, c.SERVER_WELCOME);
    });
    
    // handles unknown routes
    app.all('*', (req, res, next) => {
        if (req.method !== 'OPTIONS') {
            // 204 No Content
            return helper.sendResponse(res, 204, c.SERVER_NO_CONTENT);
        }
        next();
    });

    return app;
}