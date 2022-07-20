'use strict';

const helper        = require(__dirname + '/../helper/helper.js');
const c             = require(__dirname + '/../config/constant.js');
const config        = require(__dirname + '/../config/config.js');
const util          = require(__dirname + '/../lib/util.js');
const transporter   = require(__dirname + '/../lib/transporter.js');
const cryptor       = require(__dirname + '/../lib/cryptor.js');

const uuid          = require('uuid').v1;

const isDev                         = config.isDev();
const mailOptionsSignUp             = config.mailOptionsSignUp;
const mailOptionsUserInvite         = config.mailOptionsUserInvite;
const mailOptionsPWDReset           = config.mailOptionsPWDReset;
const mailOptionsPWDResetConfirm    = config.mailOptionsPWDResetConfirm;
const mailOptionsConfirmedAccount   = config.mailOptionsConfirmedAccount;

const api_host = config.envConfig.use('api');
const web_host = config.envConfig.use('web');

// verification link for retailer registration
const api_user_confirm_registration = '/users/signup/confirmation/'; // validates token and redirects to web registration page
const user_confirm_registration = '/#/users/signup/confirmation/'; // registration page
const user_verified_success_path = '/#/users/signup/confirmation/verified/';
const user_verified_failed_path = '/#/users/signup/confirmation/error/';
const user_token_expired_path = '/#/users/signup/confirmation/expired/';

module.exports = (database, auth) => {

    function signin(req, res, next) {
        function _proceed() {
            const data = req.body;

            const form = {
                username: '', // can be email or username
                password: ''
            };

            helper.validateBody(form, data, res, () => {
                _get_user(data);
            });
        }

        function _get_user(data) {
            database.connection((err, conn) => {
                if (err) return helper.sendError(conn, res, err, c.DATABASE_CONN_ERROR);

                const fields = [
                    'u.*',
                    'u.id AS user_id',
                    database.binToUUID('u.id', 'id'),
                    database.binToUUID('r.id', 'role_id'),
                    'r.code AS role_code',
                    'r.name AS role_name',
                    'r.description AS role_description'
                ].join(', ');

                const where = [
                    '(u.email = ? || u.username = ?)',
                    'u.activated = 1',
                    'u.deleted <> 1'
                ].join(' AND ');

                const query = `SELECT ${fields} FROM user u \
                    LEFT JOIN role r ON r.id = u.role_id \
                    WHERE ${where}`;

                conn.query(query, [data.username, data.username], (err, rows) => {
                    if (err || rows.length === 0) return helper.send400(conn, res, err, c.USER_SIGNIN_FAILED);

                    _validate_password(conn, data, rows[0]);
                });
            });
        }

        function _validate_password(conn, data, record) {
            if (!record.ivHex || record.ivHex == null) return helper.send400(conn, res, null, c.USER_SIGNIN_FAILED);

            const encryptedData = { ivHex: record.ivHex, encrypted: record.password };
            cryptor.decrypt(encryptedData, (err, decrypted) => {
                if (err || data.password !== decrypted) return helper.send400(conn, res, err, c.USER_SIGNIN_FAILED);

                delete record.password;
                _get_user_account(conn, record);
            });
        }

        function _get_user_account(conn, record) {
            const fields = [
                'a.*',
                database.binToUUID('a.user_id', 'user_id')
            ].join(', ');

            const query = `SELECT ${fields} FROM account a
                WHERE a.user_id = ?`;

            conn.query(query, [record.user_id], (err, rows) => {
                database.done(conn);

                delete record.user_id; // remove binary id -- used only in query
                const account = (rows && rows.length > 0) ? rows[0] : null;
                const user_data = { user: record, account: account };

                const token = auth.createPayloadToken(record, c.USER_TOKEN);
                user_data.token_data = token;

                req.user_data = user_data;

                return next(); // proceed to login check
            });
        }

        _proceed();
    }

    function signup(req, res) {
        function _proceed() {
            const data = req.body;
            data.id = uuid();

            const form = {
                id: 'uuid',
                _role_id: 'uuid',
                email: '',
                _username: '',
                password: '',
                _ivHex: ''
            };

            helper.validateBody(form, data, res, () => {
                database.transaction((err, conn) => {
                    if (err) return helper.sendError(conn, res, err, c.DATABASE_CONN_ERROR);

                    _create_user(conn, data, form);
                });
            });
        }

        function _create_user(conn, data, form) {
            cryptor.encrypt(data.password, (err, { ivHex, encrypted }) => {
                if (err) return helper.sendRollback(database, conn, res, err, c.USER_CREATE_FAILED);
                data.password = encrypted; // set encrypted password
                data.ivHex = ivHex;

                const set_query = database.format(form, data);
                const query = `INSERT INTO user SET ${set_query}`;
                
                conn.query(query, (err, rows) => {
                    if (err || rows.affectedRows === 0) return helper.sendRollback(database, conn, res, err, c.USER_CREATE_FAILED);
    
                    _prepare_mail(conn, data);
                });
            });
        }

        function _prepare_mail(conn, data) {
            const email = data.email;
            const type = c.REGISTRATION_TOKEN;

            const payload = {
                type,
                email: email,
                id: data.id,
                role_id: data.role_id
            };

            const token_options = { type, expiresIn: c.TOKEN_MIN_EXPIRY };
            const token = auth.createToken(payload, token_options).token;
            const email_validation_link = _create_email_validation_link(data, token);
            const from = mailOptionsSignUp.from;
            const subject = mailOptionsSignUp.subject;
            const html = mailOptionsSignUp.html(email, email_validation_link);
            const options = exports._create_mail_options(from, email, subject, html);

            if (isDev) {
                transporter.sendMail(options, (success, res_data) => {
                    if (success) {
                        helper.sendCommit(database, conn, res, options, c.USER_CREATE_FAILED, c.USER_CREATE_SUCCESS);
                    }else{
                        helper.sendRollback(database, conn, res, res_data.error, c.USER_CREATE_FAILED);
                    }
                });
            }else{
                // :- Send only
                transporter.sendOnly(options);
                helper.sendCommit(database, conn, res, null, c.USER_CREATE_FAILED, c.USER_CREATE_SUCCESS);
            }
        }

        function _create_email_validation_link(data, token) {
            const obj = { email: data.email, role_id: data.role_id };
            const base64encode = util.encodeObj(obj);
            const url = `${api_host}${api_user_confirm_registration}${base64encode}?token=${token}`;
            return url;
        }

        _proceed();
    }

    function signup_n_login(req, res) {
        function _proceed() {
            const data = req.body;
            data.id = uuid();

            const form = {
                id: 'uuid',
                _role_id: 'uuid',
                email: '',
                _username: '',
                password: ''
            };

            helper.validateBody(form, data, res, () => {
                database.transaction((err, conn) => {
                    if (err) return helper.sendError(conn, res, err, c.DATABASE_CONN_ERROR);

                    _create_user(conn, data, form);
                });
            });
        }

        function _create_user(conn, data, form) {
            cryptor.encrypt(data.password, (err, { ivHex, encrypted }) => {
                if (err) return helper.sendRollback(database, conn, res, err, c.USER_CREATE_FAILED);
                data.password = encrypted; // set encrypted password
                data.ivHex = ivHex;

                const set_query = database.format(form, data);
                const query = `INSERT INTO user SET ${set_query}`;

                conn.query(query, (err, rows) => {
                    if (err || rows.affectedRows === 0) return helper.sendRollback(database, conn, res, err, c.USER_CREATE_FAILED);

                    _get_user(conn, data)
                });
            });
        }

        function _get_user(conn, data) {
            const fields = [
                'u.*',
                database.binToUUID('u.id', 'id'),
                database.binToUUID('r.id', 'role_id'),
                'r.code AS role_code',
                'r.name AS role_name',
                'r.description AS role_description'
            ].join(', ');

            const query = `SELECT ${fields} FROM user u \
                LEFT JOIN role r ON r.id = u.role_id \
                WHERE u.id = ${database.uuidToBIN}`;

            conn.query(query, [data.id], (err, rows) => {
                if (err || rows.length === 0) return helper.send400(conn, res, err, c.USER_SIGNIN_FAILED);

                _create_user_object(conn, rows[0]);
            });
        }

        function _create_user_object(conn, record) {
            delete record.password; // remove password info
            const user_data = { user: record, account: null };

            const token = auth.createPayloadToken(record, c.USER_TOKEN);
            user_data.token_data = token;

            _prepare_mail(conn, record, user_data); // create registration token for validation -- emailed
        }

        function _prepare_mail(conn, data, user_data) {
            const email = data.email;
            const type = c.REGISTRATION_TOKEN;

            const payload = {
                type,
                email: email,
                id: data.id,
                role_id: data.role_id
            };

            const token_options = { type, expiresIn: c.TOKEN_MIN_EXPIRY };
            const token = auth.createToken(payload, token_options).token;
            const email_validation_link = _create_email_validation_link(data, token);
            const from = mailOptionsSignUp.from;
            const subject = mailOptionsSignUp.subject;
            const html = mailOptionsSignUp.html(email, email_validation_link);
            const options = exports._create_mail_options(from, email, subject, html);

            transporter.sendOnly(options);
            helper.sendCommit(database, conn, res, user_data, c.USER_CREATE_FAILED, c.USER_CREATE_SUCCESS);
        }

        function _create_email_validation_link(data, token) {
            const obj = { email: data.email, role_id: data.role_id };
            const base64encode = util.encodeObj(obj);
            const url = `${api_host}${api_user_confirm_registration}${base64encode}?token=${token}`;
            return url;
        }

        _proceed();
    }

    function confirm(req, res) {
        const decoded = req.get('decoded_token');

        function _proceed() {
            const data = req.body;
            const form = {
                base64: ''
            };

            helper.validateBody(form, data, res, () => {
                database.connection((err, conn) => {
                    if (err) return helper.sendError(conn, res, err, c.DATABASE_CONN_ERROR);
                    
                    const decodedObj = util.decodeObj(data.base64);
                    if (decodedObj.email == decoded.email) {
                        _activate_account(conn, decodedObj);
                    }else{
                        const response_message = helper.errMsgData(400, 'Mismatched user data.');
                        helper.send400(conn, res, response_message, c.USER_ACTIVATION_FAILED);
                    }
                });
            });
        }

        function _activate_account(conn, decodedObj) {
            const where = [
                `u.id = ${database.uuidToBIN}`,
                'u.deleted <> 1'
            ].join(' AND ');

            const query = `UPDATE user u \
                SET u.activated = 1 \
                WHERE ${where}`;

            conn.query(query, [decoded.id], (err, rows) => {
                if (err) return helper.send400(conn, res, err, c.USER_ACTIVATION_FAILED);
                if (rows.changedRows === 0) {
                    const response_message = helper.errMsgData(400, 'Link is either expired or invalid.');
                    return helper.send400(conn, res, response_message, c.USER_ACTIVATION_FAILED);
                }

                _prepare_mail(conn, decodedObj);
            });
        }

        function _prepare_mail(conn, record) {
            const email = record.email;
            const from = mailOptionsConfirmedAccount.from;
            const subject = mailOptionsConfirmedAccount.subject;
            const html = mailOptionsConfirmedAccount.html(email);
            const options = exports._create_mail_options(from, email, subject, html);
            
            if (isDev) {
                transporter.sendMail(options, (success, res_data) => {
                    if (success) {
                        helper.send200(conn, res, record, c.USER_ACTIVATION_SUCCESS);
                    }else{
                        helper.send400(conn, res, res_data.error, c.USER_ACTIVATION_FAILED)
                    }
                });
            }else{
                // :- Send only
                transporter.sendOnly(options);
                helper.send200(conn, res, record, c.USER_ACTIVATION_SUCCESS);
            }
        }

        _proceed();
    }

    function change_pw(req, res) {
        const decoded = req.get('decoded_token');

        function _proceed() {
            const data = req.body;
            const form = {
                password: ''
            };
            
            helper.validateBody(form, data, res, () => {
                database.connection((err, conn) => {
                    if (err) return helper.sendError(conn, res, err, c.DATABASE_CONN_ERROR);
                    
                    _get_user(conn, data); // validate if user is still active
                });
            });
        }

        function _get_user(conn, data) {
            const fields = [
                'u.*',
                'u.id AS user_id',
                database.binToUUID('u.id', 'id')
            ].join(', ');

            const where = [
                `u.id = ${database.uuidToBIN}`,
                'u.activated = 1',
                'u.deleted <> 1'
            ].join(' AND ');

            const query = `SELECT ${fields} FROM user u \
                WHERE ${where}`;

            conn.query(query, [decoded.id], (err, rows) => {
                if (err) return helper.send400(conn, res, err, c.USER_CHANGE_PW_FAILED);
                if (rows.length === 0) {
                    const response_message = helper.errMsgData(400, 'User does not exist and/or is no longer active.');
                    return helper.send400(conn, res, response_message, c.USER_CHANGE_PW_FAILED);
                }

                _change_password(conn, data, rows[0]);
            });
        }

        function _change_password(conn, data, record) {
            cryptor.encrypt(data.password, (err, { ivHex, encrypted }) => {
                if (err) return helper.send400(conn, res, err, c.USER_CHANGE_PW_FAILED);
                
                const query = `UPDATE user u \
                    SET u.password = ? AND u.ivHex = ? \
                    WHERE u.id = ?`;

                conn.query(query, [encrypted, ivHex, record.user_id], (err, rows) => {
                    if (err || rows.affectedRows === 0) return helper.send400(conn, res, err, c.USER_CHANGE_PW_FAILED);
                    
                    helper.send204(conn, res, null, c.USER_CHANGE_PW_SUCCESS);
                });
            });
        }

        _proceed();
    }

    function forgot_pw(req, res) {
        function _proceed() {
            const data = req.body;
            const form = {
                email: ''
            };
    
            helper.validateBody(form, data, res, () => {
                database.connection((err, conn) => {
                    if (err) return helper.sendError(conn, res, err, c.DATABASE_CONN_ERROR);
                    
                    _get_user(conn, data); // validate if user is still active
                });
            });
        }

        function _get_user(conn, data) {
            const fields = [
                'u.*',
                'u.id AS user_id',
                database.binToUUID('u.id', 'id'),
                database.binToUUID('r.id', 'role_id'),
                'r.code AS role_code',
                'r.name AS role_name',
                'r.description AS role_description'
            ].join(', ');

            const where = [
                'u.email = ?',
                'u.activated = 1',
                'u.deleted <> 1'
            ].join(' AND ');

            const query = `SELECT ${fields} FROM user u \
                INNER JOIN role r ON r.id = u.role_id \
                WHERE ${where}`;

            conn.query(query, [data.email], (err, rows) => {
                if (err) return helper.send400(conn, res, err, c.USER_FORGOT_PW_FAILED);
                if (rows.length === 0) {
                    const response_message = helper.errMsgData(400, 'User does not exist and/or is no longer active.');
                    return helper.send400(conn, res, response_message, c.USER_FORGOT_PW_FAILED);
                }

                _prepare_mail(conn, rows[0]);
            });
        }

        function _prepare_mail(conn, record) {
            const email = record.email;
            const type = c.RESET_PW_TOKEN;

            const payload = {
                type,
                email: email,
                id: record.id,
                role_id: record.role_id
            };

            const token_options = { type, expiresIn: c.TOKEN_MIN_EXPIRY };
            const token = auth.createToken(payload, token_options).token;
            const email_validation_link = _create_email_validation_link(record, token);
            const from = mailOptionsPWDReset.from;
            const subject = mailOptionsPWDReset.subject;
            const html = mailOptionsPWDReset.html(email, email_validation_link);
            const options = exports._create_mail_options(from, email, subject, html);
            
            if (isDev) {
                transporter.sendMail(options, (success, res_data) => {
                    if (success) {
                        helper.send200(conn, res, options, c.USER_FORGOT_PW_SUCCESS);                   
                    }else{
                        helper.send400(conn, res, res_data.error, c.USER_FORGOT_PW_FAILED)
                    }
                });
            }else{
                // :- Send only
                transporter.sendOnly(options);
                helper.send200(conn, res, null, c.USER_FORGOT_PW_SUCCESS);
            }
        }

        function _create_email_validation_link(record, token) {
            const obj = { email: record.email, role_id: record.role_id };
            const base64encode = util.encodeObj(obj);
            const url = `${api_host}${api_user_confirm_registration}${base64encode}?token=${token}`;
            return url;
        }
    
        _proceed();
    }

    function confirm_pw(req, res) { // confirm forgot password request
        const decoded = req.get('decoded_token');

        function _proceed() {
            const data = req.body;
            const form = {
                password: ''
            };
            
            helper.validateBody(form, data, res, () => {
                database.connection((err, conn) => {
                    if (err) return helper.sendError(conn, res, err, c.DATABASE_CONN_ERROR);
                    
                    _get_user(conn, data); // validate if user is still active
                });
            });
        }

        function _get_user(conn, data) {
            const fields = [
                'u.*',
                'u.id AS user_id',
                database.binToUUID('u.id', 'id')
            ].join(', ');

            const where = [
                `u.id = ${database.uuidToBIN}`,
                'u.activated = 1',
                'u.deleted <> 1'
            ].join(' AND ');

            const query = `SELECT ${fields} FROM user u \
                WHERE ${where}`;

            conn.query(query, [decoded.id], (err, rows) => {
                if (err) return helper.send400(conn, res, err, c.USER_CHANGE_PW_FAILED);
                if (rows.length === 0) {
                    const response_message = helper.errMsgData(400, 'User does not exist and/or is no longer active.');
                    return helper.send400(conn, res, response_message, c.USER_CHANGE_PW_FAILED);
                }

                _change_password(conn, data, rows[0]);
            });
        }

        function _change_password(conn, data, record) {
            cryptor.encrypt(data.password, (err, { ivHex, encrypted }) => {
                if (err) return helper.send400(conn, res, err, c.USER_CHANGE_PW_FAILED);

                const query = `UPDATE user u \
                    SET u.password = ? AND u.ivHex = ? \
                    WHERE u.id = ${database.uuidToBIN}`;

                conn.query(query, [encrypted, ivHex, decoded.id], (err, rows) => {
                    if (err || rows.affectedRows === 0) return helper.send400(conn, res, err, c.USER_CHANGE_PW_FAILED);
                    
                    auth.removeToken(decoded); // remove reset password token | prevent reuse
                    _prepare_mail(conn, record);
                });
            });
        }

        function _prepare_mail(conn, record) {
            const email = record.email;
            const from = mailOptionsPWDResetConfirm.from;
            const subject = mailOptionsPWDResetConfirm.subject;
            const html = mailOptionsPWDResetConfirm.html(email);
            const options = exports._create_mail_options(from, email, subject, html);
            
            if (isDev) {
                transporter.sendMail(options, (success, res_data) => {
                    if (success) {
                        helper.send200(conn, res, options, c.USER_CHANGE_PW_SUCCESS);                   
                    }else{
                        helper.send400(conn, res, res_data.error, c.USER_CHANGE_PW_FAILED)
                    }
                });
            }else{
                // :- Send only
                transporter.sendOnly(options);
                helper.send204(conn, res, null, c.USER_CHANGE_PW_SUCCESS);
            }
        }

        _proceed();
    }

    function create_account(req, res) {
        const decoded = req.get('decoded_token');

        function _proceed() {
            const data = req.body;
            data.user_id = decoded.id;
            
            const form = {
                user_id: 'uuid',
                _prefix: '',
                _suffix: '',

                first_name: '',
                _middle_name: '',
                last_name: '',
                _gender: '',
                _birthdate: '', // YYYY-MM-DD

                _title: '',
                _position: '',
                _location: '',
                _avatar: '',

                _mobile: '',
                _website: ''
            };
            
            helper.validateBody(form, data, res, () => {
                database.connection((err, conn) => {
                    if (err) return helper.sendError(conn, res, err, c.DATABASE_CONN_ERROR);

                    _bind_account(conn, data, form);
                });
            });
        }

        function _bind_account(conn, data, form) {
            const set_query = database.format(form, data);
            const query = `INSERT INTO account \
                SET ${set_query}`;

            conn.query(query, (err, rows) => {
                if (err || rows.affectedRows === 0) return helper.send400(conn, res, err, c.USER_ACCOUNT_CREATE_FAILED);

                _get_user_account(conn, data);
            });
        }

        function _get_user_account(conn, record) {
            const fields = [
                'a.*',
                database.binToUUID('a.user_id', 'user_id')
            ].join(', ');

            const query = `SELECT ${fields} FROM account a
                WHERE a.user_id = ${database.uuidToBIN}`;

            conn.query(query, [record.user_id], (err, rows) => {
                if (err || rows.length === 0) return helper.send400(conn, res, err, c.USER_ACCOUNT_CREATE_FAILED);

                helper.send200(conn, res, rows[0], c.USER_ACCOUNT_CREATE_SUCCESS);
            });
        }

        _proceed();
    }

    function update_account(req, res) {
        const decoded = req.get('decoded_token');

        function _proceed() {
            const data = req.body;
            
            const form = {
                _prefix: '',
                _suffix: '',

                _first_name: '',
                _middle_name: '',
                _last_name: '',
                _gender: '',
                _birthdate: '', // YYYY-MM-DD

                _title: '',
                _position: '',
                _location: '',

                _mobile: '',
                _website: ''
            };
            
            helper.validateBody(form, data, res, () => {
                database.connection((err, conn) => {
                    if (err) return helper.sendError(conn, res, err, c.DATABASE_CONN_ERROR);

                    _update_account(conn, data, form);
                });
            });
        }

        function _update_account(conn, data, form) {
            const set_query = database.format(form, data);
            const query = `UPDATE account \
                SET ${set_query} \
                WHERE user_id = ${database.uuidToBIN}`;

            conn.query(query, [decoded.id], (err, rows) => {
                if (err || rows.affectedRows === 0) return helper.send400(conn, res, err, c.USER_ACCOUNT_UPDATE_FAILED);

                _get_user_account(conn);
            });
        }

        function _get_user_account(conn) {
            const fields = [
                'a.*',
                database.binToUUID('a.user_id', 'user_id')
            ].join(', ');

            const query = `SELECT ${fields} \
                FROM account a
                WHERE a.user_id = ${database.uuidToBIN}`;

            conn.query(query, [decoded.id], (err, rows) => {
                if (err || rows.length === 0) return helper.send400(conn, res, err, c.USER_ACCOUNT_UPDATE_FAILED);

                helper.send200(conn, res, rows[0], c.USER_ACCOUNT_UPDATE_SUCCESS);
            });
        }

        _proceed();
    }

    return {
        signin,
        signup,
        signup_n_login,
        confirm,
        change_pw,
        forgot_pw,
        confirm_pw,
        create_account,
        update_account
    }
}

/**
 * @param from email sender
 * @param to email recipient
 * @param subject email subject
 * @param html email body
 */
exports._create_mail_options = (from, to, subject, html) => {
    const mail_options = {
        from, to, subject, html
    };
    return mail_options;
}