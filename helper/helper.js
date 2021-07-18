'use strict';

const util      = require(__dirname + '/../lib/util.js');
const c         = require(__dirname + '/../config/constant.js');
const cluster   = require("cluster");

exports.validateBody = (form, source, res, next) => {
    let data = util._get
        .form_data(form)
        .from(source);

    if (data instanceof Error) {
        const response_message = this.errMsgData(400, data.message);
        const responseData = this.responseData(false, c.BAD_PARAMETERS, response_message);
        return this.sendResponse(res, 400, responseData);
    }

    next(data);
};

/** RESPONSE HANDLER */
exports.send = (code, success = true) => (conn, res, data, context) => {
    if (conn) conn.release();
    const responseData = this.responseData(success, context, data);
	this.sendResponse(res, code, responseData);
}

exports.send200 = (conn, res, data, context) => {
    this.send(200)(conn, res, data, context);
}

exports.send204 = (conn, res, data, context) => {
    this.send(204)(conn, res, data, context);
}

exports.send400 = (conn, res, err, context) => {
    const error_data = this.checkError(err);
    this.send(400, false)(conn, res, error_data, context);
}

exports.send401 = (conn, res, err, context) => {
    const error_data = this.checkError(err, 401);
    this.send(401, false)(conn, res, error_data, context);
}

exports.send403 = (conn, res, err, context) => {
    const error_data = this.checkError(err, 403);
    this.send(403, false)(conn, res, error_data, context);
}

exports.send404 = (conn, res, err, context) => {
    const error_data = this.checkError(err, 404);
    this.send(404, false)(conn, res, error_data, context);
}

exports.send500 = (conn, res, err, context) => {
    const error_data = this.checkError(err, 500);
    this.send(500, false)(conn, res, error_data, context);
}

exports.send503 = (conn, res, err, context) => {
    const error_data = this.checkError(err, 503);
    this.send(503, false)(conn, res, error_data, context);
}

exports.sendError = (conn, res, err, context) => {
    const error_data = this.checkError(err);
    this.send(error_data.code)(conn, res, error_data, context);
}

exports.sendResponse = (res, code, data) => {
    res
        .status(code)
        .send(data)
        .end();
}

/** DATABASE HANDLER */
exports.sendRollback = (database, conn, res, err, context) => {
    database.rollback(conn, () => this.send400(null, res, err, context));
}

exports.sendCommit = (database, conn, res, data, err_context, succ_context) => {
    database.commit(conn, err => {
        if (err) return this.send400(null, res, err, err_context);

        this.send200(null, res, data, succ_context);
    });
}

/** ERROR HANDLER */
exports.checkError = (err, errCode = 400) => {
    this.log(err, 'ERROR');

    if (err && err.code) {
        const code = err.code.toString();

        if (code === 'ER_BAD_FIELD_ERROR' ||
            code === 'ER_WRONG_VALUE_COUNT_ON_ROW' ||
            code === 'ER_NO_SUCH_TABLE' ||
            code === 'ER_WRONG_TABLE_NAME' ||
            code === 'ER_ACCESS_DENIED_ERROR' ||
            code === 'ER_NO_REFERENCED_ROW_2' ||
            code === 'ER_DATA_TOO_LONG') {

            return { code: 400, error: 'Bad parameters.' };

        } else if (code === 'ER_DUP_ENTRY') {
            return { code: 409, error: 'Duplicate entry' }; // err.sqlMessage

        } else if (code === 'ECONNREFUSED' ||
            code === 'ER_NOT_SUPPORTED_AUTH_MODE' ||
            code === 'ER_DBACCESS_DENIED_ERROR' ||
            code === 'ESOCKET') {

            return { code: 500, error: 'Server connection error.' };

        } else if (code === 'ER_PARSE_ERROR' ||
            code === 'ER_WRONG_NUMBER_OF_COLUMNS_IN_SELECT' ||
            code === 'ER_NON_UNIQ_ERROR' ||
            code === 'ER_LOCK_WAIT_TIMEOUT' ||
            code === 'PROTOCOL_SEQUENCE_TIMEOUT') {

            return { code: 500, error: 'Internal server error.' };
        } else if (err.sql) {
            return { code: 500, error: 'Internal server error.' };
        } else if (code === 'LIMIT_UNEXPECTED_FILE') {
            return { code: 400, error: 'Invalid file key.' };
        } else if (code === 'UnknownEndpoint') { // Inaccessible host: `s3.aws_bucket_region.amazonaws.com'
            return { code: 500, error: 'Internal server error.' };
        }
    }

    if (err) delete err.storageErrors; // remove storage errors from multer

    return err || null;
};

/**
 * 
 * @param {*} success 
 * @param {*} context 
 * @param {*} data 
 * @returns 
 * 
 * "success": true,
 * "message": MSG_CONTEXT,
 * "data": { // MSG_DATA
 *    "message": "Nothing to do here."
 * }
 */
exports.responseData = (success, context, data) => {
    const response_data = {
        success: success,
        message: context,
        data: data
    };
    return response_data;
}

exports.errMsgData = (code, msg) => { // used for response.data.data message for uniformity
    return { code, error: msg };
}

/** PARSER */

exports.parseSettingsConfig = (settingsStr) => {
    let settings = {};
    if (!settingsStr) return settings;
    const settingsComponent = settingsStr.split('&');
    for (const component of settingsComponent) {
        const subComponents = component.split('::');
        const key = subComponents[0];
        const value = subComponents[1];

        if (key && value && value.length > 0) {
            settings[key] = this.isBoolean(value) ? this.boolValue(value) : this.isNanConvert(value);
        }
    }
    return settings;
}

exports.isBoolean = (value) => {
    return value === 'false' || value === 'true';
}

exports.boolValue = (value) => {
    return value === 'false' ? false : true;
}

exports.isNanConvert = (value) => {
    if (value.length === 0) return value;
    return isNaN(value) ? value : Number(value);
}

exports.combineObject = (object, toObject) => {
    for (const key in object) {
        toObject[key] = object[key]
    }
    return toObject
}

/** GENERATORS */

exports.randString = (length) => {
	let randString = "";
	let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";

	for (let i = 0; i < length; i++) {
		randString += possible.charAt(Math.floor(Math.random() * possible.length));
	}

	return randString;
}

exports.randChar = (length) => {
	let randChar = "";
	let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

	for (let i = 0; i < length; i++) {
		randChar += possible.charAt(Math.floor(Math.random() * possible.length));
	}

	return randChar;
}

exports.randNumber = (length) => {
	let randNumber = "";
	let possible = "0123456789";

	for (let i = 0; i < length; i++) {
		randNumber += possible.charAt(Math.floor(Math.random() * possible.length));
	}

	return randNumber;
}

exports.log = (n, message = "LOG") => {
    console.log(`${cluster.isMaster ? 'Master' : 'Worker'} ${process.pid}::${message}:`, n);
}