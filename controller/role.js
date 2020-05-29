'use strict';

const uuid          = require('uuid').v1;
const helper        = require(__dirname + '/../helper/helper.js');
const c             = require(__dirname + '/../config/constant.js');

module.exports = (database) => {

    function create(req, res) {

        const uuID = uuid();

        function _proceed() {
            const data = req.body;
            data.id = uuID;

            const form = {
                id: 'uuid',
                code: '',
                name: '',
                _description: ''
            };

            helper.validateBody(form, data, res, () => {
                _add(data, form);
            });
        }

        function _add(data, form) {

            database.connection((err, conn) => {
                if (err) return helper.sendConnError(res, err, c.DATABASE_CONN_ERROR);

                const set_query = database.format(form, data);
                const query = `INSERT INTO role SET ${set_query}`;

                conn.query(query, (err, rows) => {
                    if (err) return helper.send400(conn, res, err, c.ROLE_CREATE_FAILED);

                    _load_role(conn);
                });
            });
        }

        function _load_role(conn) {

            const fields = [
                'r.*',
                database.binToUUID('r.id', 'id')
            ].join(', ');

            const query = `SELECT ${fields} FROM role r
                WHERE r.id = ${database.uuidToBIN(uuID)}`;

            conn.query(query, (err, rows) => {
                if (err) return helper.send400(conn, res, err, c.ROLE_CREATE_FAILED);

                _success_response(conn, rows[0]);
            });
        }

        function _success_response(conn, data) {

            helper.send200(conn, res, data, c.ROLE_CREATE_SUCCESS);
        }

        _proceed();
    }

    function update(req, res) {

        const uuID = req.params.id;

        function _proceed() {
            const data = req.body;

            const form = {
                _code: '',
                _name: '',
                _description: ''
            };

            helper.validateBody(form, data, res, () => {
                _update(data, form);
            });
        }

        function _update(data, form) {

            database.connection((err, conn) => {
                if (err) return helper.sendConnError(res, err, c.DATABASE_CONN_ERROR);

                const set_query = database.format(form, data);
                const query = `UPDATE role SET ${set_query}
                    WHERE id = ${database.uuidToBIN(uuID)}`;

                conn.query(query, (err, rows) => {
                    if (err || rows.affectedRows == 0) return helper.send400(conn, res, err, c.ROLE_UPDATE_FAILED);

                    _load_role(conn);
                });
            });
        }

        function _load_role(conn) {

            const fields = [
                'r.*',
                database.binToUUID('r.id', 'id')
            ].join(', ');

            const query = `SELECT ${fields} FROM role r
                WHERE r.id = ${database.uuidToBIN(uuID)}`;

            conn.query(query, (err, rows) => {
                if (err) return helper.send400(conn, res, err, c.ROLE_UPDATE_FAILED);

                _success_response(conn, rows[0]);
            });
        }

        function _success_response(conn, data) {

            helper.send200(conn, res, data, c.ROLE_UPDATE_SUCCESS);
        }

        _proceed();
    }

    function fetch_one(req, res) {

        const roleId = req.params.id;

        function proceed() {

            database.connection((err, conn) => {
                if (err) return helper.sendConnError(res, err, c.DATABASE_CONN_ERROR);

                _get_item(conn);
            });
        }

        function _get_item(conn) {

            const fields = [
                'r.*',
                database.binToUUID('r.id', 'id')
            ].join(', ');

            const query = `SELECT ${fields} FROM role r
                WHERE r.deleted <> 1 AND r.id = ${database.uuidToBIN(roleId)}`;

            conn.query(query, (err, rows) => {
                if (err || rows.length == 0) return helper.send400(conn, res, err, c.ROLE_FETCH_FAILED);

                _success_response(conn, rows[0]);
            });
        }

        function _success_response(conn, data) {

            helper.send200(conn, res, data, c.ROLE_FETCH_SUCCESS);
        }

        proceed();
    }

    function fetch_multiple(req, res) {

        const q = req.query.q;
        const deleted = req.query.deleted;

        const limit   = Number(req.query.limit) || c.LIMIT;
        const page    = (Number(req.query.page) || 1);
        const offset  = (page - 1) * limit;

        function proceed() {

            database.connection((err, conn) => {
                if (err) return helper.sendConnError(res, err, c.DATABASE_CONN_ERROR);

                _get_item_count(conn);
            });
        }

        function _get_item_count(conn) {

            let query = 'SELECT COUNT(r.id) as item_count FROM role r';
            let where = [], values = [];

            if (q) {
                where.push(`LOWER(r.name) LIKE LOWER(?)`)
                values.push(`%${q}%`);
            }

            if (deleted) {
                where.push(`r.deleted = ?`);
                values.push(deleted);
            }

            if (where.length > 0) {
                query += ` WHERE ${where.join(' AND ')}`;
            }

            conn.query(query, values, (err, rows) => {
                if (err) return helper.send400(conn, res, err, c.ROLE_FETCH_FAILED);

                _get_items(conn, rows.length > 0 ? rows[0].item_count : 0);
            });
        }

        function _get_items(conn, item_count) {

            const data = {
                item_count: item_count,
                limit: limit,
                page: page,
                items: []
            };

            if (item_count === 0) {
                return _success_response(conn, data);
            }

            const fields = [
                'r.*',
                database.binToUUID('r.id', 'id')
            ].join(', ');

            let query = `SELECT ${fields} FROM role r`;
            let where = [], values = [];

            if (q) {
                where.push(`LOWER(r.name) LIKE LOWER(?)`)
                values.push(`%${q}%`);
            }

            if (deleted) {
                where.push(`r.deleted = ?`);
                values.push(deleted);
            }

            if (where.length > 0) {
                query += ` WHERE ${where.join(' AND ')}`;
            }

            if (limit > 0) {
                query += ' LIMIT ? OFFSET ?';
                values.push(limit, offset);
            }

            conn.query(query, values, (err, rows) => {
                if (err) return helper.send400(conn, res, err, c.ROLE_FETCH_FAILED);

                data.items = rows;
                _success_response(conn, data);
            });
        }

        function _success_response(conn, data) {

            helper.send200(conn, res, data, c.ROLE_FETCH_SUCCESS);
        }

        proceed();
    }

    function remove(req, res) {

        const uuID = req.params.id;

        function _proceed() {

            database.connection((err, conn) => {
                if (err) return helper.sendConnError(res, err, c.DATABASE_CONN_ERROR);

                const query = `UPDATE role SET deleted = 1 \
                    WHERE id = ${database.uuidToBIN(uuID)}`;

                conn.query(query, (err, rows) => {
                    if (err || rows.changedRows === 0) return helper.send400(conn, res, err, c.ROLE_DELETE_FAILED);

                    _success_response(conn);
                });
            });
        }

        function _success_response(conn) {

            const data = { id: uuID };
            helper.send200(conn, res, data, c.ROLE_DELETE_SUCCESS);
        }

        _proceed();
    }

    return {
        create,
        update,
        fetch_one,
        fetch_multiple,
        remove
    }
}