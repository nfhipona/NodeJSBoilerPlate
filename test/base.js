'use strict';

                            require('chai').should();
const expect            =   require('chai').expect;
const request           =   require('supertest');
const config            =   require(__dirname + '/../config/config.js');

const envConfig         =   config.envConfig;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const endpoint          = envConfig.use('api');
const api               = request(endpoint); // modular

const headers           =   { 'Content-Type': 'application/json', 'Accept': 'application/json' }
const t                 =   token => { return { 'x-access-token': token } };

console.log(`\nTest Server Endpoint: ${endpoint}`);
module.exports = { api, expect, headers, t };