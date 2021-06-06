// from cdi-mysql-express-master

'use strict';
/**
    Utilities
*/

/**
 * Data validator
 * @param1 pass a sample object
    put _ as first character of the key to indicate as optional
    @example:
        get_data({
            name: '',  // any string
            age: 1, //
            admin: true,
            _skype: ''
        });
 * @param2 source (req.body, req.query, req.params)
 **/
function get_data (sample, source, ref) {
    const final_data = {};
    let has_error = false;
    let temp;

    ref = ref || '';

    if (typeof sample !== typeof source || (Array.isArray(sample) !== Array.isArray(source))) {
        return new Error('Sample-Source type mismatch');
    }

    if (Array.isArray(sample) && sample.length) {
        temp = source.map((a, index) => {
            const ret = get_data(sample[0], source[index], ref + `[${index}]`);
            if (ret instanceof Error) {
                has_error = ret;
            }
            return ret;
        });

        return has_error
            ? has_error
            : temp;
    }

    for (let prop in sample) {
        if (sample.hasOwnProperty(prop)) {
            let source_prop = prop;
            let data;

            if (prop[0] === '_') {
                source_prop = prop.slice(1);
            }

            try {
                data = validate_primitive_value(sample, prop, source, source_prop, (ref ? ref + '.' : '') + prop);
            } catch (err) {
                return err;
            }

            if (data instanceof Error) {
                return data;
            }

            if (typeof data !== 'undefined') {
                final_data[source_prop] = data;
            }
        }
    }

    return final_data;
}



function validate_primitive_value (sample, prop, source, source_prop, ref) {
    let   data,
          source_type = typeof source[source_prop];
    const type = typeof sample[prop];

    if (type === 'string' && source[source_prop]) {
        source_type = type;
        source[source_prop] = source[source_prop];
    }

    if (type === 'number' && !isNaN(source[source_prop])) {
        source_type = type;
        source[source_prop] = Number(source[source_prop]);
    }

    if (source_type === 'string' && Array.isArray(sample[prop])) {
        try {
            source[source_prop] = JSON.parse(source[source_prop]);
            source_type = type;
        } catch (e) {
            return new Error(ref + ' invalid type');
        }
    }

    if (source_type === 'string' && type === 'boolean') {
        source_type = type;
        source[source_prop] = !!source[source_prop];
    }

    if ((source_type === 'undefined' && prop[0] !== '_') || (prop[0] !== '_' &&
        source_type !== 'string' && !source[source_prop] && source[source_prop] !== 0)
        || (prop[0] !== '_' && source_type === 'string' && source[source_prop] === '') ||
        (Array.isArray(sample[prop]) && prop[0] !== '_'
            && !source[source_prop].length)) {
        return new Error(ref + ' is missing');
    }

    if (source_type !== 'undefined' && source[source_prop] !== null &&
        source_type !== type && !Array.isArray(source)) {
        return new Error(ref + ' invalid type');
    }

    if ((Array.isArray(source[source_prop]) && typeof source[source_prop][0] === 'object') ||
        (source[source_prop] && typeof source[source_prop] === 'object')) {
        data = get_data(sample[prop], source[source_prop], ref);

        if (data instanceof Error) {
            throw data;
        }
    }

    return source[source_prop];
}

const _get = {
    form_data: (sample) => {
        const from = (source) => get_data(sample, source);
        return {from};
    }
};


function random_string (i) {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    let l = i || 32;
    let str = '';

    while (l--) {
        str += possible.charAt(~~(Math.random() * 62));
    }

    return str;
}


function pad (num, size) {
    return ('000000000' + num).substr(-(size || 2));
}


function to_title_case (str) {
    return str
        ? str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())
        : '';
}


function caps_first (string) {
    return string.charAt(0)
        .toUpperCase()
    + string.slice(1);
}


function split (a, n) {
    const len = a.length;
    const out = [];

    let i = 0;

    while (i < len) {
        out.push(a.slice(i, i += Math.ceil((len - i) / n--)));
    }

    return out;
}


function get_log_stream (dir) {
    const file_stream_rotator = require('file-stream-rotator');
    const proc_id = process.env.cpu_number || 0;

    return file_stream_rotator.getStream({
        filename: dir + '/access-%DATE%.' + proc_id + '.log',
        frequency: 'daily',
        verbose: false,
        date_format: 'YYYY-MM-DD'
    });
}


function clone (obj) {
    return JSON.parse(JSON.stringify(obj));
}

function is_SN (student_number) {
    const current_year = new Date().getFullYear().toString();
    const year_regex = '20([0-' + (current_year[2]-1) + '][0-9]|' + current_year[2] + '[0-' + current_year[3] + '])';
    return new RegExp('(19[5-9][0-9]|' + year_regex + ')-\\d{5}')
        .test(student_number);
}

function is_email (email) {
    return /^[a-z0-9._%+-]+@[a-z0-9-]+\.[a-z]{2,3}$/.test(email.toLowerCase());
}

function encodeObj(obj, encoding = 'base64') {
    const objJSONStr = JSON.stringify(obj);
    const encodedObj = Buffer.from(objJSONStr).toString(encoding);
    return encodedObj;
}

function decodeObj(base64, encoding = 'base64') {
    try {
        const decodedObj = Buffer.from(base64, encoding);
        const jsonObj = JSON.parse(decodedObj);
        return jsonObj;
    } catch(e) {
        return {};
    }
}

/** Collection ~ Ojbect ~ attribute */
function indexOfObject(collection, object, attr) {
    for (let i = 0; i < collection.length; i++) {
        if (collection[i][attr] === object[attr]) {
            return i;
        }
    }
    return -1;
}

/** Collection ~ str*/
function indexOf(collection, str) {

    for (let i = 0; i < collection.length; i++) {
        if (collection[i] === str) {
            return i;
        }
    }

    return -1;
}

module.exports = {
    _get,
    get_data,
    random_string,
    pad,
    to_title_case,
    caps_first,
    split,
    get_log_stream,
    clone,
    is_SN,
    is_email,
    encodeObj,
    decodeObj,
    indexOfObject,
    indexOf
};