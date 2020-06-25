'use strict';

const helper        = require(__dirname + '/../helper/helper.js');
const c             = require(__dirname + '/../config/constant.js');

module.exports = (config = {}) => {

    return (req, res, next) => {

        const isOriginAllowed = req.headers.origin && config.origins.some(e => {
            return req.headers.origin.match(e);
        }) || false;

        const isHostsAllowed = config.hosts.some(e => {
            return req.hostname.match(e);
        });

        res.header("Access-Control-Allow-Origin", isOriginAllowed || isHostsAllowed ? req.headers.origin : config.origins);
        res.header('Access-Control-Allow-Credentials', !!config.allow_credentials);

        res.header('Access-Control-Allow-Methods', config.methods);
        res.header("Access-Control-Allow-Headers", config.headers);

        if (!isOriginAllowed && !isHostsAllowed) {
            const cError = new Error('Invalid domain');

            console.log(`host: ${req.hostname} -- origin: ${req.headers.origin}`);
            return helper.send403(null, res, cError, c.FORBIDDEN_REQUEST);
        }

        const isOptions = req.method.isEqualToStr('OPTIONS');
        if (isOptions) return res.send();

        next();
    };
};