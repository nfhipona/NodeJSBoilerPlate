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
        if (err) return cb(err);

        conn.beginTransaction(err => {
            if (err) return cb(err);
            cb(null, conn);
        });
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

exports.format = (format, data) => {
    function _proceed() {
        let values = [];
        for (let key in format) {
            let type = format[key];
            let formatted_key = key[0] === '_' ? key.slice(1) : key;
            let value = data[formatted_key];

            if (typeof value !== 'undefined') {
                let formatted_value = _value_formatter(type, value);
                values.push(`\`${formatted_key}\` = ${formatted_value}`);
            }
        }
        return values.join(', ');
    }

    function _value_formatter(type, value) {
        const isNum = typeof type == 'number' ? true : false;
        if (isNum) {
            return `${value}`;
        }else{
            if (type == 'uuid') {
                return `UUID_TO_BIN('${value}', 1)`;
            }else{
                return `'${value}'`;
            }
        }
    }

    return _proceed();
}

/**
 * SQL Formatter BIN_TO_UUID
 */
exports.binToUUID = (source, alias = "") => {
    return alias.length > 0 ? `BIN_TO_UUID(${source}, 1) AS ${alias}` : `BIN_TO_UUID(${source}, 1)`;
}

/**
 * SQL Formatter UUID_TO_BIN
 */
exports.uuidToBIN = (uuID) => {
    return `UUID_TO_BIN('${uuID}', 1)`;
}