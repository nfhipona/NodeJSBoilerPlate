'use strict';

const uuid          = require('uuid').v1;
const helper        = require(__dirname + '/../helper/helper.js');
const c             = require(__dirname + '/../config/constant.js');

module.exports = (database) => {

    function set(req, res)    {
        const uuID = uuid();

        function _proceed() {
            const data = req.body;

            const form = {
                title: '',
                _description: '',
                _message: '',
                is_down: 0
            }

            helper.validateBody(form, data, res, data => {
                _begin(data);
            });
        }

        function _begin(data) {
            database.transaction((err, conn) => {
                if (err) return helper.sendError(conn, res, err, c.DATABASE_CONN_ERROR);

                _check_if_down(conn, data);
            });
        }

        function _check_if_down(conn, data) {
            const where = [
                `id = ?`,
                `is_down = ?`
            ].join(' AND ');

            // check if the current status is same as previous
            // prevent duplicate entry in maintenance history
            const query = `SELECT * FROM maintenance
                WHERE ${where}`;

            conn.query(query, [1, data.is_down], (err, rows) => {
                const response_message = helper.errMsgData(400, 'Could not set while another maintenance window is active.');
                if (err || rows.length > 0) return helper.sendRollback(database, conn, res, err || response_message, c.MAINTENANCE_SET_FAILED);

                _set_maintenance(conn, data); // proceed normally
            });
        }

        function _set_maintenance(conn, data) {
            const data_cp = { ...data, id: 1 }; // set id:1 - to make sure only 1 entry is created

            const query = `INSERT INTO maintenance \
                SET ?
                ON DUPLICATE KEY UPDATE ?`;

            conn.query(query, [data_cp, data_cp], (err, rows) => {
                if (err) return helper.sendRollback(database, conn, res, err, c.MAINTENANCE_SET_FAILED);

                _create_history(conn, data);
            });
        }

        function _create_history(conn, data) {
            const form = {
                id: 'uuid',
                title: '',
                _description: '',
                _message: '',
                status: ''
            };

            const { is_down, ...d } = data;
            const status = is_down ? c.SERVER_DOWN_STATUS : c.SERVER_UP_STATUS; // '1 - SERVER_DOWN | 0 - SERVER_UP'
            const history = { status, ...d, id: uuID };

            const set_query = database.format(form, history);
            const query = `INSERT INTO maintenance_history \
                SET ${set_query}`;

            conn.query(query, (err, rows) => {
                if (err) return helper.sendRollback(database, conn, res, err, c.MAINTENANCE_SET_FAILED);

                _load_info(conn, 1);
            });
        }

        function _load_info(conn, infoId) {
            const query = `SELECT * FROM maintenance
                WHERE id = ?`;

            conn.query(query, [infoId], (err, rows) => {
                if (err || rows.length === 0) return helper.sendRollback(database, conn, res, err, c.MAINTENANCE_SET_FAILED);
                
                _success_response(conn, rows[0]);
            });
        }

        function _success_response(conn, data) {
            helper.sendCommit(database, conn, res, data, c.MAINTENANCE_SET_FAILED, c.MAINTENANCE_SET_SUCCESS);
        }

        _proceed();
    }

    function info(req, res) {
        function _proceed() {
            database.connection((err, conn) => {
                if (err) return helper.sendError(conn, res, err, c.DATABASE_CONN_ERROR);

                const query = `SELECT * FROM maintenance
                    WHERE id = ?`;

                conn.query(query, [1], (err, rows) => {
                    if (err) return helper.send400(conn, res, err, c.MAINTENANCE_INFO_FETCH_FAILED);

                    const record = rows.length > 0 ? rows[0] : null;
                    _success_response(conn, record);
                });
            });
        }

        function _success_response(conn, data) {
            helper.send200(conn, res, data, c.MAINTENANCE_INFO_FETCH_SUCCESS);
        }

        _proceed();
    }

    function retrieve_history(req, res) {
        const q       = req.query.q;

        const limit   = Number(req.query.limit) || c.LIMIT;
        const page    = (Number(req.query.page) || 1);
        const offset  = (page - 1) * limit;
        const order   = req.query.order || c.ORDER;

        function _proceed() {
            database.connection((err, conn) => {
                if (err) return helper.sendError(conn, res, err, c.DATABASE_CONN_ERROR);

                _get_item_count(conn);
            });
        }

        function _get_item_count(conn) {
            let query = `SELECT COUNT(h.id) AS item_count FROM maintenance_history h`;
            let where = [], values = [];

            if (q) {
                where.push(`LOWER(h.title) LIKE LOWER(?)`);
                values.push(`%${q}%`);
            }

            if (where.length > 0) {
                query += ` WHERE ${where.join(' AND ')}`;
            }

            conn.query(query, values, (err, rows) => {
                if (err) return helper.send400(conn, res, err, c.MAINTENANCE_HISTORY_FETCH_FAILED);

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
                'h.*',
                database.binToUUID('h.id', 'id')
            ].join(', ');

            let query = `SELECT ${fields} FROM maintenance_history h`;
            let where = [], values = [];

            if (q) {
                where.push(`LOWER(h.title) LIKE LOWER(?)`);
                values.push(`%${q}%`);
            }

            if (where.length > 0) {
                query += ` WHERE ${where.join(' AND ')}`;
            }

            if (order.isEqualTo('desc')) {
                query += ` ORDER BY h.timestamp ${order}`;
            }else{
                query += ` ORDER BY h.timestamp`;
            }

            if (limit > 0) {
                query += ' LIMIT ? OFFSET ?';
                values.push(limit, offset);
            }

            conn.query(query, values, (err, rows) => {
                if (err) return helper.send400(conn, res, err, c.MAINTENANCE_HISTORY_FETCH_FAILED);

                data.items = rows;
                _success_response(conn, data);
            });
        }

        function _success_response(conn, data) {
            helper.send200(conn, res, data, c.MAINTENANCE_HISTORY_FETCH_SUCCESS);
        }

        _proceed();
    }

    return {
        set,
        info,

        retrieve_history
    }
}