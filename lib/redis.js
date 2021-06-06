'user strict';

const helper            = require(__dirname + '/../helper/helper.js');
const config            = require(__dirname + '/../config/config.js');
const { createClient }  = require('redis');

const redisConf         = config.redisConfig;

module.exports = prepareClient();

function prepareClient() {
    const client = createClient(redisConf);

    client.on('ready', () => {
        helper.log('Redis server is running.');
    });
    
    client.on('error', (err) => {
        helper.log('Error in redis server.', err);
    });

    const setToken = (uuid, token, expiresIn) => {
        client.set(uuid, token);
        client.expire(uuid, expiresIn);
    }

    const getToken = (uuid, cb) => {
        client.exists(uuid, cb);
    }

    const delToken = (uuid, cb) => {
        client.del(uuid, cb);
    }
    
    return {
        setToken,
        getToken,
        delToken
    }
}