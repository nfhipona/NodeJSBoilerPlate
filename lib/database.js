'use strict';

const config    = require(__dirname + '/../config/config.js').dbConfig;
const mysql     = require('mysql');

// connection pool
const mysqlPool = mysql.createPool(config);

// define functions
exports.query = mysqlPool.query; // sql, values, cb

exports.connection = (cb) => mysqlPool.getConnection(cb);

exports.transaction = (cb) => {

    mysqlPool.getConnection((err, conn) => {

        return err ? cb(err) : cb(null, conn);
    });
}

exports.done = (conn) => {

    conn.release();
}

exports.rollback = (conn, cb) => {

    conn.rollback(() => {
        this.done(conn);

        cb();
    });
}

exports.commit = (conn, cb) => {

    conn.commit(err => {

        if (err) {
            this.rollback(conn, () => { // handles rollback
                cb(err);
            });
        }else{
            this.done(conn);
            cb(null);
        }
    });
}