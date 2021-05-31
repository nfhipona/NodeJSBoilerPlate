'use strict';

const util      = require(__dirname + '/../lib/util.js');
const cluster   = require("cluster");

exports.validateBody = (form, source, res, next) => {
    let data = util._get
        .form_data(form)
        .from(source);

    if (data instanceof Error) {
        let error_data = this.constructErrorData(data.message, null);
        return this.sendResponse(res, 400, error_data);
    }

    next(data);
};

/** RESPONSE HANDLER */

exports.send200 = (conn, res, data, message) => {
    if (conn) conn.release();
    const responseData = this.constructSuccessData(message, data);
	this.sendResponse(res, 200, responseData);
}

exports.send400 = (conn, res, err, message) => {
    if (conn) conn.release();
    const error_data = this.checkError(err);
    const responseData = this.constructErrorData(message, error_data);
	this.sendResponse(res, 400, responseData);
}

exports.send401 = (conn, res, err, message) => {
    if (conn) conn.release();
    const error_data = this.checkError(err);
    const responseData = this.constructErrorData(message, error_data);
	this.sendResponse(res, 401, responseData);
}

exports.send403 = (conn, res, err, message) => {
    if (conn) conn.release();
    const error_data = this.checkError(err);
    const responseData = this.constructErrorData(message, error_data);
	this.sendResponse(res, 403, responseData);
}

exports.send404 = (conn, res, err, message) => {
    if (conn) conn.release();
    const error_data = this.checkError(err);
    const responseData = this.constructErrorData(message, error_data);
	this.sendResponse(res, 404, responseData);
}

exports.send500 = (conn, res, err, message) => {
    if (conn) conn.release();
    const error_data = this.checkError(err);
    const responseData = this.constructErrorData(message, error_data);
	this.sendResponse(res, 500, responseData);
}

exports.send503 = (conn, res, err, message) => {
    if (conn) conn.release();
    const error_data = this.checkError(err);
    const responseData = this.constructErrorData(message, error_data);
	this.sendResponse(res, 503, responseData);
}

exports.sendConnError = (res, err, message) => {
    const error_data = this.checkError(err);
    const responseData = this.constructErrorData(message, error_data);
	this.sendResponse(res, 400, responseData);
}

exports.sendResponse = (res, code, data) => {
    res
        .status(code)
        .send(data)
        .end();
}

/** ERROR HANDLER */

exports.checkError = (err) => {
    console.log('\nError: ', err);

    if (err && err.code) {
        const code = err.code.toString();

        if (code === 'ER_BAD_FIELD_ERROR' ||
            code === 'ER_WRONG_VALUE_COUNT_ON_ROW' ||
            code === 'ER_NO_SUCH_TABLE' ||
            code === 'ER_WRONG_TABLE_NAME' ||
            code === 'ER_ACCESS_DENIED_ERROR' ||
            code === 'ER_NO_REFERENCED_ROW_2' ||
            code === 'ER_DATA_TOO_LONG') {

            return this.logErr(err, { message: 'Bad parameters.' });

        } else if (code === 'ER_DUP_ENTRY') {
            return this.logErr(err, { message: 'Duplicate entry' }); // err.sqlMessage

        } else if (code === 'ECONNREFUSED') {
            return this.logErr(err, { message: 'Server connection error.' });

        } else if (code === 'ER_PARSE_ERROR' ||
            code === 'ER_WRONG_NUMBER_OF_COLUMNS_IN_SELECT' ||
            code === 'ER_NON_UNIQ_ERROR' ||
            code === 'ER_LOCK_WAIT_TIMEOUT' ||
            code === 'PROTOCOL_SEQUENCE_TIMEOUT') {

            return this.logErr(err, { message: 'Server error.' });
        } else if (err.sql) {
            return this.logErr(err, { message: 'Server error.' });
        }
    }

    return err;
};

exports.logErr = (err, data) => {
    console.log('\nServer error log: ', err);

    return data;
}

exports.constructErrorData = (context, data) => {
    if (!data && context) console.log(`Error message: `, context);
    return this.responseData(false, context, data);
};

exports.constructSuccessData = (context, data) => {
    return this.responseData(true, context, data);
}

exports.responseData = (success, context, data) => {
    const response_data = {
        success: success,
        message: context,
        data: data
    };

    return response_data;
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

        settings[key] = this.isBoolean(value) ? this.boolValue(value) : this.isNanConvert(value);
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

exports.log = (n) => {
    if (cluster.isMaster) {
        console.log(n);
    }
}