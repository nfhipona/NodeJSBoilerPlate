'use strict';

const config        = require(__dirname + '/../config/config.js');
const c             = require(__dirname + '/../config/constant.js');
const helper        = require(__dirname + '/../helper/helper.js');

const jwt           = require('jsonwebtoken');
const redis         = require('redis');

const redisConf     = config.redisConfig;
const jwtConf       = config.jwtConfig;

// prepare redis server
const client        = redis.createClient({ port: redisConf.port, host: redisConf.host, password: redisConf.password });

client.on('ready', () => {
    console.log('Redis server is running.');
});

client.on('error', (err) => {
    console.log('Error in redis server.', err);
});

// use for type 'user_token'
exports.sign = (payload) => {

    return this.signWithExpiry(payload, jwtConf.expiresIn);
};

// use for custom expiry
exports.signWithExpiry = (payload, expiresIn) => {

    const options = { algorithm: jwtConf.algorithm, expiresIn: expiresIn }
    const token = jwt.sign(payload, jwtConf.secret, options);

    console.log(`\nSign options: `, options)

    const id = payload.id.toString();
    client.set(id, token);
    client.expire(id, expiresIn);

	return token;
};

exports.removeTokenSignature = (decoded, next) => {

    client.del(decoded.id.toString(), next);
}

exports.signout = (req, res) => { // always success - clear token when provided or just log off the user

    const token = req.get('x-access-token');
    if (!token) { return helper.send200(null, res, null, c.USER_SIGNED_OUT); }

    this.verify(token, (err, decoded) => {

		if (decoded) {
            this.removeTokenSignature(decoded, (err, reply) => {}); // force remove token signature
		}

        helper.send200(null, res, null, c.USER_SIGNED_OUT);
	});
}

exports.verify = (token, next) => {

    jwt.verify(token, jwtConf.secret, (err, decoded) => {

        if (decoded) {
            client.exists(decoded.id.toString(), (err, reply) => {

                if (reply === 1) {
					next(null, decoded);
				}else{
                    next(err || '-- Auth token does not exists', null);
				}
			});
		}else{
			next(err, null);
		}
    });
}

exports.verifyWithType = (type) => (req, res, next) => {

    const token = req.get('x-access-token');
    if (!token) { return helper.send403(null, res, new Error('Bad request.'), 'Invalid token'); }

    this.verify(token, (err, decoded) => {

        // check token auth type
        if (decoded && decoded.type == type) {
            console.log(`\nDecoded token ${type}: `, decoded);

            req.headers.decoded_token = decoded;
            next();
        }else{
            console.log(`\nDecoded token ${type} error: `, err, decoded);

            if (decoded) {
                helper.send401(null, res, err, c.UNAUTHORIZED_REQUEST);
            }else{
                helper.send403(null, res, err, c.FORBIDDEN_REQUEST);
            }
        }
    });
}

exports.createToken = (payload, options = {}) => { // { type = '', expiresIn = 0 }

    const type = options.type || 'token';
    const expiresIn = options.expiresIn || 0;

    const token = expiresIn > 0 ? this.signWithExpiry(payload, expiresIn) : this.sign(payload);
    const token_data = { token, type };

    return token_data;
}