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

exports.format = (format, data, pkey = 'id') => {

    function _proceed() {

        let values = [];
        for (let key of Object.keys(format)) {

            let type = format[key];
            let value = (data[key]) ? data[key] : "";

            let formatted_value = _value_formatter(type, value);

            values.push(`\`${key}\` = ${formatted_value}`);
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