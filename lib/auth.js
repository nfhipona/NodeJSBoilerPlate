'use strict';

const jwt       = require('jsonwebtoken');

const config    = require(__dirname + '/../config/config.js');
const c         = require(__dirname + '/../config/constant.js');
const helper    = require(__dirname + '/../helper/helper.js');

const jwtConf   = config.jwtConfig;

module.exports = (client) => {

    const createToken = (payload, options = {}) => { // { type = '', expiresIn = 0 }
        const type = options.type || c.USER_TOKEN;
        const expiresIn = options.expiresIn || c.TOKEN_MAX_EXPIRY;

        const jwtOptions = { algorithm: jwtConf.algorithm, expiresIn: expiresIn }
        const token = jwt.sign(payload, jwtConf.secret, jwtOptions);
        const token_data = { token, type };
        const token_key = `${payload.id}-${type}`; // this should prevent mixing of token
        client.setToken(token_key, token, expiresIn);
        return token_data;
    }

    const removeToken = (decoded, cb) => {
        const token_key = `${decoded.id}-${decoded.type}`; // create token key
        client.delToken(token_key, cb);
    }

    const verifyToken = (type) => (req, res, next) => {
        const token = req.get('x-access-token');
        if (!token) { 
            const response_message = helper.errMsgData(403, 'Invalid Token.');
            return helper.send403(null, res, response_message, c.FORBIDDEN_REQUEST);
        }

        jwt.verify(token, jwtConf.secret, (err, decoded) => {
            if (decoded && decoded.type == type) { // check token auth type
                const token_key = `${decoded.id}-${decoded.type}`; // create token key
                client.getToken(token_key, (err, reply) => {
                    helper.log(decoded, `TOKEN`);
                    if (reply === 1) {
                        req.headers.decoded_token = decoded;
                        next();
                    }else{
                        const response_message = helper.errMsgData(401, 'Invalid Token.');
                        helper.send401(null, res, response_message, c.UNAUTHORIZED_REQUEST);
                    }
                });
            }else{
                const response_message = helper.errMsgData(403, 'Invalid Token.');
                helper.send403(null, res, response_message, c.FORBIDDEN_REQUEST);
            }
        });
    } 

    const createPayloadToken = (record, type) => {
        const payload = {
            type,
            id: record.id,
            role_id: record.role_id,
            role_code: record.role_code,
            role_name: record.role_name,
            email: record.email
        }
        const token_options = { type, expiresIn: c.TOKEN_MAX_EXPIRY };
        return createToken(payload, token_options);
    }

    return {
        createToken,
        removeToken,
        verifyToken,
        createPayloadToken
    }
}