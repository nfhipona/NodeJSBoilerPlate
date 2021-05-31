'use strict';

const jwt       = require('jsonwebtoken');

const config    = require(__dirname + '/../config/config.js');
const c         = require(__dirname + '/../config/constant.js');
const helper    = require(__dirname + '/../helper/helper.js');

const jwtConf   = config.jwtConfig;

module.exports = (client) => {

    const createToken = (payload, options = {}) => { // { type = '', expiresIn = 0 }
        const type = options.type || 'token';
        const expiresIn = options.expiresIn || 0;

        const jwtOptions = { algorithm: jwtConf.algorithm, expiresIn: expiresIn }
        const token = jwt.sign(payload, jwtConf.secret, jwtOptions);
        const token_data = { token, type };

        client.setToken(payload.id, token, expiresIn);
        return token_data;
    }

    const removeToken = (decoded, cb) => {
        client.delToken(decoded.id, cb);
    }

    const verifyToken = (type) => (req, res, next) => {
        const token = req.get('x-access-token');
        if (!token) { return helper.send403(null, res, new Error('Bad request.'), c.INVALID_TOKEN); }

        const decoded = jwt.verify(token, jwtConf.secret);
        console.log(`\nDecoded token '${type}': `, decoded);

        if (decoded) {
            client.getToken(decoded.id, (err, reply) => {
                if (reply === 1) {
                    // check token auth type
                    if (decoded && decoded.type == type) {
                        req.headers.decoded_token = decoded;
                        next();
                    }else{
                        if (decoded) {
                            helper.send401(null, res, err, c.UNAUTHORIZED_REQUEST);
                        }else{
                            helper.send403(null, res, err, c.FORBIDDEN_REQUEST);
                        }
                    }
                }else{
                    next(err, null);
                }
            });
        }else{
            next(err, null);
        }
    } 

    return {
        createToken,
        removeToken,
        verifyToken
    }
}