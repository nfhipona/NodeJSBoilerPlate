'use strict';

const helper = require(__dirname + '/../helper/helper.js');
const c = require(__dirname + '/../config/constant.js');

/*
 * Authentication middleware
 *
 * Parameters:
 *  database    : {object} database object
 *
 * Function: Verifies token and to check permission and role
 *
 */
module.exports = (database) => {

    /*
     * ACL Authentication
     *
     * Parameters:
     *  resource    : {string} resource to check
     *  mode        : {string} permission access to check | '*' will be read as public and no access restriction
     *  skip_check: {bool} skip route maintenance check for admin only
     *
     * Function: Verifies token and check role if it has the proper permission
     *
     */
    const acl = (resource, mode, skip_check = false) => (req, res, next) => {
        const decoded = req.get('decoded_token');
        const roleId = decoded.role_id;
        const roleCode = decoded.role_code;

        function _proceed() {
            if (!database || !resource || !mode) return helper.send500(null, res, err, c.SERVER_ERROR);
            if (mode == '*') return next(); // public for all proceed next
            if (skip_check && (roleCode.isEqualTo('sup_admin') || roleCode.isEqualTo('sys_admin'))) return next(); // skip validation

            database.connection((err, conn) => {
                if (err) return helper.sendError(conn, res, err, c.DATABASE_CONN_ERROR);
                _is_server_down(conn);
            });
        }

        function _is_server_down(conn) {
            const query = `SELECT * FROM maintenance`;
            conn.query(query, null, (err, rows) => {
                if (err) return helper.send503(conn, res, err, c.SERVICE_UNAVAILABLE);

                const info = rows.length > 0 ? rows[0] : {};
                const is_down = info.is_down || 0;

                if (is_down) return helper.send503(conn, res, info, c.SERVICE_UNAVAILABLE);
                _validate(conn);
            });
        }

        function _validate(conn) {
            const fields = [
                's.id AS resource_id',
                's.code AS resource_code',
                's.name AS resource_name',
                's.description AS resource_description',
                's.deleted AS resource_disabled',
                'r.code AS role_code',
                'r.name AS role_name',
                'r.description AS role_description',
                'p.mode AS access_mode',
                'p.is_disabled AS access_disabled',
                'p.timestamp AS timestamp'
            ].join(', ');

            const where = [
                `p.role_id = ${database.uuidToBIN}`,
                `LOWER(s.code) = LOWER(?)`,
                `LOWER(p.mode) = LOWER(?)`
            ].join(' AND ');

            // get role's resource access permission
            const query = `SELECT ${fields} FROM permission p \
                INNER JOIN resource s ON s.id = p.resource_id \
                INNER JOIN role r ON r.id = p.role_id \
                WHERE ${where}`;

            conn.query(query, [roleId, resource, mode], (err, rows) => {
                if (err) return helper.send401(conn, res, err, c.UNAUTHORIZED_REQUEST);

                const record = rows.length > 0 ? rows[0] : null;
                if (record && record.resource_disabled === 1) { // check if resource is deleted - service is unavailable
                    const response_message = helper.errMsgData(503, 'This resource is no longer active and/or available.');
                    return helper.send503(conn, res, response_message, c.SERVICE_UNAVAILABLE);
                }

                if (record == null || (record && record.access_disabled === 1)) { // check if resource access is disabled
                    const response_message = helper.errMsgData(401, 'Your account has a limited to no access to this resource.');
                    return helper.send401(conn, res, response_message, c.UNAUTHORIZED_REQUEST);
                }
                
                database.done(conn); // release connection
                return next();
            });
        }

        _proceed();
    }

    /*
     * Login check for admins
     *
     * Parameters:
     *  resource    : {string} resource to check
     *  mode        : {string} permission access to check
     *
     * Function: Checks if user can proceed or not
     *
     */
    const login_check = (resource, mode) => (req, res, next) => {

        const data = req.user_data;
        const record = data.user;
        const roleId = record.role_id;
        const roleCode = record.role_code;

        function _proceed() {
            if (!database || !resource || !mode) return helper.send500(null, res, err, c.SERVER_ERROR);
            if (roleCode.isEqualToStr('sup_admin') || 
                roleCode.isEqualToStr('sys_admin')) return helper.send200(null, res, data, c.USER_SIGNIN_SUCCESS); // skip validation

            database.connection((err, conn) => {
                if (err) return helper.sendError(conn, res, err, c.DATABASE_CONN_ERROR);

                _is_server_down(conn);
            });
        }

        function _is_server_down(conn) {
            const query = `SELECT * FROM maintenance`;
            conn.query(query, null, (err, rows) => {
                if (err) return helper.send503(conn, res, err, c.SERVICE_UNAVAILABLE);

                const info = rows.length > 0 ? rows[0] : {};
                const is_down = info.is_down || 0;

                if (is_down) return helper.send503(conn, res, info, c.SERVICE_UNAVAILABLE);

                _validate(conn);
            });
        }

        function _validate(conn) {
            const fields = [
                's.id AS resource_id',
                's.code AS resource_code',
                's.name AS resource_name',
                's.description AS resource_description',
                's.deleted AS resource_disabled',
                'r.code AS role_code',
                'r.name AS role_name',
                'r.description AS role_description',
                'p.mode AS access_mode',
                'p.is_disabled AS access_disabled',
                'p.timestamp AS timestamp'
            ].join(', ');

            const where = [
                `p.role_id = ${database.uuidToBIN}`,
                `LOWER(s.code) = LOWER(?)`,
                `LOWER(p.mode) = LOWER(?)`
            ].join(' AND ');

            // get role's resource access permission
            const query = `SELECT ${fields} FROM permission p \
                INNER JOIN resource s ON s.id = p.resource_id \
                INNER JOIN role r ON r.id = p.role_id \
                WHERE ${where}`;

            conn.query(query, [roleId, resource, mode], (err, rows) => {
                if (err || rows.length === 0) return helper.send401(conn, res, err, c.UNAUTHORIZED_REQUEST);

                const record = rows[0];
                if (record.resource_disabled === 1) { // check if resource is deleted - service is unavailable
                    const response_message = helper.errMsgData(503, 'This resource is no longer active and/or available.');
                    return helper.send503(conn, res, response_message, c.SERVICE_UNAVAILABLE);
                }

                if (record.access_disabled === 1) { // check if resource access is disabled
                    const response_message = helper.errMsgData(401, 'Your account has a limited to no access to this resource.');
                    return helper.send401(conn, res, response_message, c.UNAUTHORIZED_REQUEST);
                }

                helper.send200(conn, res, data, c.USER_LOGIN_SUCCESS);
            });
        }

        _proceed();
    }

    /*
     * Route maintenance check
     * Function: Validates public route if server is under maintenance
     */
    const is_maintenance = (req, res, next) => {
        function _proceed() {
            database.connection((err, conn) => {
                if (err) return helper.sendError(conn, res, err, c.DATABASE_CONN_ERROR);

                _is_server_down(conn);
            });
        }

        function _is_server_down(conn) {
            const query = `SELECT * FROM maintenance`;
            conn.query(query, null, (err, rows) => {
                if (err) return helper.send503(conn, res, err, c.SERVICE_UNAVAILABLE);

                const info = rows.length > 0 ? rows[0] : {};
                const is_down = info.is_down || 0;

                if (is_down) return helper.send503(conn, res, info, c.SERVICE_UNAVAILABLE);

                database.done(conn);
                next();
            });
        }

        _proceed();
    }

    return {
        acl,
        login_check,
        is_maintenance
    }
}