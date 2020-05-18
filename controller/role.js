'use strict';

const helper    = require(__dirname + '/../helpers/helper.js');
const c         = require(__dirname + '/../helpers/constants.js');

module.exports = (database) => {

    function create(req, res) {

        function _proceed() {
            const data = req.body;

            const form = {
                code: '',
                name: '',
                _description: ''
            };

            helper.validateBody(form, data, res, () => {
                _add(data);
            });
        }

        function _add(data) {

            database.connection((err, conn) => {
                if (err) return helper.sendConnError(res, err, c.DATABASE_CONN_ERROR);

                const query = 'INSERT INTO role SET ?';

                conn.query(query, data, (err, rows) => {
                    if (err) return helper.send400(conn, res, err, c.ROLE_CREATE_FAILED);

                    _load_role(conn, rows.insertId);
                });
            });
        }

        function _load_role(connection, id) {

            const query = 'SELECT * FROM role \
                WHERE id = ?';

            connection.query(query, [id], (err, rows, _) => {
                if (err) { return helper.send400(connection, res, err, c.ROLE_CREATE_FAILED); }

                _success_response(connection, rows[0]);
            });
        }

        function _success_response(connection, data) {

            helper.send200(connection, res, data, c.ROLE_CREATE_SUCCESS);
        }

        _proceed();
    }

    function update(req, res) {

        const id = req.params.id;

        function _proceed() {
            const data = req.body;

            const form = {
                _code: '',
                _name: '',
                _description: ''
            };

            helper.validateBody(form, data, res, () => {
                _update(data);
            });
        }

        function _update(data) {

            database(res, connection => {

                const query = 'UPDATE role SET ? \
                    WHERE id = ?';

                connection.query(query, [data, id], (err, rows, _) => {
                    if (err) { return helper.send400(connection, res, err, c.ROLE_UPDATE_FAILED); }

                    _load_role(connection, id);
                });
            });
        }

        function _load_role(connection, id) {

            const query = 'SELECT * FROM role \
                WHERE id = ?';

            connection.query(query, [id], (err, rows, _) => {
                if (err) { return helper.send400(connection, res, err, c.ROLE_UPDATE_FAILED); }

                _success_response(connection, rows[0]);
            });
        }

        function _success_response(connection, data) {

            helper.send200(connection, res, data, c.ROLE_UPDATE_SUCCESS);
        }

        _proceed();
    }

    function fetch_multiple(req, res) {

        const q = req.query.q;
        const limit   = Number(req.query.limit) || c.LIMIT;
        const page    = (Number(req.query.page) || 1);
        const offset  = (page - 1) * limit;

        function proceed() {

            database(res, connection => {

                if (limit > 0) {
                    _get_item_count(connection);
                }else{
                    _get_all(connection);
                }
            });
        }

        function _get_item_count(connection) {

            let query = 'SELECT COUNT(r.id) as item_count FROM role r';
            const values = [];

            if (q) {
                query += ` WHERE LOWER(r.name) LIKE LOWER(?)`;
                values.push(`%${q}%`);
            }

            connection.query(query, values, (err, rows, _) => {
                if (err) { return helper.send400(connection, res, err, c.ROLE_FETCH_FAILED); }

                _get_items(connection, rows.length > 0 ? rows[0].item_count : 0);
            });
        }

        function _get_items(connection, item_count) {

            const data = {
                item_count: item_count,
                limit: limit,
                page: page,
                items: []
            };

            if (item_count === 0) {
                return _success_response(connection, data);
            }

            let query = `SELECT * FROM role r`;
            const values = [];

            if (q) {
                query += ` WHERE LOWER(r.name) LIKE LOWER(?)`;
                values.push(`%${q}%`);
            }

            if (limit > 0) {
                query += ' LIMIT ? OFFSET ?';
                values.push(limit, offset);
            }

            connection.query(query, values, (err, rows, _) => {
                if (err) { return helper.send400(connection, res, err, c.ROLE_FETCH_FAILED); }

                data.items = rows;
                _success_response(connection, data);
            });
        }

        function _get_all(connection) {

            let query = `SELECT * FROM role r`;
            const values = [];

            if (q) {
                query += ` WHERE LOWER(r.name) LIKE LOWER(?)`;
                values.push(`%${q}%`);
            }

            connection.query(query, values, (err, rows, _) => {
                if (err) { return helper.send400(connection, res, err, c.ROLE_FETCH_FAILED); }

                _success_response(connection, rows);
            });
        }

        function _success_response(connection, data) {

            helper.send200(connection, res, data, c.ROLE_FETCH_SUCCESS);
        }

        proceed();
    }

    function remove(req, res) {

        const roleId = req.params.id;

        function _proceed() {

            database(res, connection => {

                const query = 'UPDATE role SET deleted = 1 \
                    WHERE id = ?';

                connection.query(query, [roleId], (err, rows, _) => {
                    if (err || rows.changedRows === 0) { return helper.send400(connection, res, err, c.ROLE_DELETE_FAILED); }

                    _success_response(connection, roleId);
                });
            });
        }

        function _success_response(connection, id) {

            const data = { id: id };
            helper.send200(connection, res, data, c.ROLE_DELETE_SUCCESS);
        }

        _proceed();
    }

    return {
        create,
        update,
        fetch_multiple,
        remove
    }
}