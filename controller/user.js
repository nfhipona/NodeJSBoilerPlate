'use strict';

const helper        = require(__dirname + '/../helper/helper.js');
const c             = require(__dirname + '/../config/constant.js');
const config        = require(__dirname + '/../config/config.js');
const util          = require(__dirname + '/../lib/util.js');
const transporter   = require(__dirname + '/../lib/transporter.js');

const uuid          = require('uuid').v1;
const bcrypt        = require('bcrypt');

const isDev                         = config.isDev();
const bcryptConf                    = config.bcryptConfig;
const mailOptionsSignUp             = config.mailOptionsSignUp;
const mailOptionsUserInvite         = config.mailOptionsUserInvite;
const mailOptionsPWDReset           = config.mailOptionsPWDReset;
const mailOptionsPWDResetConfirm    = config.mailOptionsPWDResetConfirm;

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
                    INNER JOIN role r ON r.id = u.role_id \
                    WHERE ${where}`;

                conn.query(query, [data.username, data.username], (err, rows, _) => {
                    if (err || rows.length === 0) return helper.send400(conn, res, err, c.USER_SIGNIN_FAILED);

                    _validate_password(conn, data, rows[0]);
                });
            });
        }

        function _validate_password(conn, data, record) {
            bcrypt.compare(data.password, record.password, (err, result) => {
                if (result) {
                    delete record.password;
                    _get_user_account(conn, record);
                }else{
                    helper.send400(conn, res, err, c.USER_SIGNIN_FAILED);
                }
            });
        }

        function _get_user_account(conn, record) {
            const fields = [
                'a.*',
                database.binToUUID('a.user_id', 'user_id')
            ].join(', ');

            const query = `SELECT ${fields} FROM account a
                WHERE a.user_id = ?`;

            conn.query(query, [record.user_id], (err, rows, _) => {
                database.done(conn);

                delete record.user_id; // remove binary id -- used only in query
                const account = (rows && rows.length > 0) ? rows[0] : null;
                const user_data = { user: record, account: account };

                const token = _create_user_token(record, c.USER_TOKEN);
                user_data.token_data = token;

                req.user_data = user_data;

                return next(); // proceed to login check
            });
        }

        function _create_user_token(record, type) {
            const payload = {
                type,
                id: record.id,
                role_id: record.role_id,
                role_code: record.role_code,
                role_name: record.role_name,
                email: record.email
            }
            const token_options = { type, expiresIn: c.TOKEN_MAX_EXPIRY };
            return auth.createToken(payload, token_options);
        }

        _proceed();
    }

    

    return {
        signin
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

exports._encrypt_password = (password, next) => {
    bcrypt.genSalt(bcryptConf.rounds, (err, salt) => {
        if (err) { return next(err, null); }

        bcrypt.hash(password, salt, (err, hash) => {
            if (err) { return next(err, null); }
            next(null, hash);
        });
    });
}