'use strict';

const uuid          = require('uuid').v1;
const async         = require('async');
const helper        = require(__dirname + '/../helper/helper.js');
const c             = require(__dirname + '/../config/constant.js');

module.exports = (database) => {

    /** APP RESOURCES */

    function add_resource(req, res) {

        const uuID = uuid();

        function _proceed() {
            const data = req.body;
            data.id = uuID;

            const form = {
                id: 'uuid',
                code: '',
                name: '',
                _description: ''
            }

            helper.validateBody(form, data, res, () => {
                _begin(data, form);
            });
        }

        function _begin(data, form) {

            database.connection((err, conn) => {
                if (err) return helper.sendConnError(res, err, c.DATABASE_CONN_ERROR);

                const set_query = database.format(form, data);
                const query = `INSERT INTO resource SET ${set_query}`;

                conn.query(query, (err, rows) => {
                    if (err) return helper.send400(conn, res, err, c.RESOURCE_CREATE_FAILED);

                    _load_resource(conn);
                });
            });
        }

        function _load_resource(conn) {

            const fields = [
                'r.*',
                database.binToUUID('r.id', 'id')
            ].join(', ');

            const query = `SELECT ${fields} FROM resource r
                WHERE r.id = ${database.uuidToBIN(uuID)}`;

            conn.query(query, (err, rows) => {
                if (err || rows.length === 0) return helper.send400(conn, res, err, c.RESOURCE_CREATE_FAILED);

                _success_response(conn, rows[0]);
            });
        }

        function _success_response(conn, data) {

            helper.send200(conn, res, data, c.RESOURCE_CREATE_SUCCESS);
        }

        _proceed();
    }

    function update_resource(req, res) {

        const uuID = req.params.id;

        function _proceed() {
            const data = req.body;

            const form = {
                _code: '',
                _name: '',
                _description: ''
            }

            helper.validateBody(form, data, res, () => {
                _begin(data, form);
            });
        }

        function _begin(data, form) {

            database.connection((err, conn) => {
                if (err) return helper.sendConnError(res, err, c.DATABASE_CONN_ERROR);

                const set_query = database.format(form, data);
                const query = `UPDATE resource SET ${set_query}
                    WHERE id = ${database.uuidToBIN(uuID)}`;

                conn.query(query, (err, rows) => {
                    if (err) return helper.send400(conn, res, err, c.RESOURCE_UPDATE_FAILED);

                    _load_resource(conn);
                });
            });
        }

        function _load_resource(conn) {

            const fields = [
                'r.*',
                database.binToUUID('r.id', 'id')
            ].join(', ');

            const query = `SELECT ${fields} FROM resource r
                WHERE r.id = ${database.uuidToBIN(uuID)}`;

            conn.query(query, (err, rows) => {
                if (err || rows.length === 0) return helper.send400(conn, res, err, c.RESOURCE_UPDATE_FAILED);

                _success_response(conn, rows[0]);
            });
        }

        function _success_response(conn, data) {

            helper.send200(conn, res, data, c.RESOURCE_UPDATE_SUCCESS);
        }

        _proceed();
    }

    function retrieve_resource(req, res) {

        const uuID = req.params.id;

        function _proceed() {

            database.connection((err, conn) => {
                if (err) return helper.sendConnError(res, err, c.DATABASE_CONN_ERROR);

                _load_resource(conn);
            });
        }

        function _load_resource(conn) {

            const fields = [
                'r.*',
                database.binToUUID('r.id', 'id')
            ].join(', ');

            const query = `SELECT ${fields} FROM resource r
                WHERE r.id = ${database.uuidToBIN(uuID)}`;

            conn.query(query, (err, rows) => {
                if (err || rows.length === 0) return helper.send400(conn, res, err, c.RESOURCE_FETCH_FAILED);

                _success_response(conn, rows[0]);
            });
        }

        function _success_response(conn, data) {

            helper.send200(conn, res, data, c.RESOURCE_FETCH_SUCCESS);
        }

        _proceed();
    }

    function retrieve_resources(req, res) {

        const q       = req.query.q;
        const deleted = req.query.deleted;

        const limit   = Number(req.query.limit) || c.LIMIT;
        const page    = (Number(req.query.page) || 1);
        const offset  = (page - 1) * limit;
        const order   = req.query.order || c.ORDER;

        function _proceed() {

            database.connection((err, conn) => {
                if (err) return helper.sendConnError(res, err, c.DATABASE_CONN_ERROR);

                _get_item_count(conn);
            });
        }

        function _get_item_count(conn) {

            let query = `SELECT COUNT(s.id) AS item_count FROM resource s`;
            let where = [], values = [];

            if (deleted) {
                where.push(`s.deleted = ?`);
                values.push(deleted);
            }

            if (q) {
                where.push(`LOWER(s.name) LIKE LOWER(?)`);
                values.push(`%${q}%`);
            }

            if (where.length > 0) {
                query += ` WHERE ${where.join(' AND ')}`;
            }

            conn.query(query, values, (err, rows) => {
                if (err) return helper.send400(conn, res, err, c.RESOURCE_FETCH_FAILED);

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
                's.*',
                database.binToUUID('s.id', 'id')
            ].join(', ');

            let query = `SELECT ${fields} FROM resource s`;
            let where = [], values = [];

            if (deleted) {
                where.push(`s.deleted = ?`);
                values.push(deleted);
            }

            if (q) {
                where.push(`LOWER(s.name) LIKE LOWER(?)`);
                values.push(`%${q}%`);
            }

            if (where.length > 0) {
                query += ` WHERE ${where.join(' AND ')}`;
            }

            if (order.isEqualToStr('desc')) {
                query += ` ORDER BY s.name ${order}`;
            }else{
                query += ` ORDER BY s.name`;
            }

            if (limit > 0) {
                query += ' LIMIT ? OFFSET ?';
                values.push(limit, offset);
            }

            conn.query(query, values, (err, rows) => {
                if (err) return helper.send400(conn, res, err, c.RESOURCE_FETCH_FAILED);

                data.items = rows;
                _success_response(conn, data);
            });
        }

        function _success_response(conn, data) {

            helper.send200(conn, res, data, c.RESOURCE_FETCH_SUCCESS);
        }

        _proceed();
    }

    function enable_resource(req, res) {

        const uuID = req.params.id;

        function _proceed() {

            database.connection((err, conn) => {
                if (err) return helper.sendConnError(res, err, c.DATABASE_CONN_ERROR);

                const query = `UPDATE resource SET deleted = 0
                    WHERE id = ${database.uuidToBIN(uuID)}`;

                conn.query(query, (err, rows) => {
                    if (err || rows.changedRows === 0) return helper.send400(conn, res, err, c.RESOURCE_ENABLE_FAILED);

                    _load_resource(conn);
                });
            });
        }

        function _load_resource(conn) {

            const fields = [
                'r.*',
                database.binToUUID('r.id', 'id')
            ].join(', ');

            const query = `SELECT ${fields} FROM resource r
                WHERE r.id = ${database.uuidToBIN(uuID)}`;

            conn.query(query, (err, rows) => {
                if (err || rows.length === 0) return helper.send400(conn, res, err, c.RESOURCE_FETCH_FAILED);

                _success_response(conn, rows[0]);
            });
        }

        function _success_response(conn, data) {

            helper.send200(conn, res, data, c.RESOURCE_ENABLE_SUCCESS);
        }

        _proceed();
    }

    function disable_resource(req, res) {

        const uuID = req.params.id;

        function _proceed() {

            database.connection((err, conn) => {
                if (err) return helper.sendConnError(res, err, c.DATABASE_CONN_ERROR);

                const query = `UPDATE resource SET deleted = 1
                    WHERE id = ${database.uuidToBIN(uuID)}`;

                conn.query(query, (err, rows) => {
                    if (err || rows.changedRows === 0) return helper.send400(conn, res, err, c.RESOURCE_DISABLE_FAILED);

                    _load_resource(conn);
                });
            });
        }

        function _load_resource(conn) {

            const fields = [
                'r.*',
                database.binToUUID('r.id', 'id')
            ].join(', ');

            const query = `SELECT ${fields} FROM resource r
                WHERE r.id = ${database.uuidToBIN(uuID)}`;

            conn.query(query, (err, rows) => {
                if (err || rows.length === 0) return helper.send400(conn, res, err, c.RESOURCE_FETCH_FAILED);

                _success_response(conn, rows[0]);
            });
        }

        function _success_response(conn, data) {

            helper.send200(conn, res, data, c.RESOURCE_DISABLE_SUCCESS);
        }

        _proceed();
    }

    /** RESOURCE PERMISSIONS */

    function set_permission(req, res) {

        const roleId        = req.params.roleId;
        const resourceId    = req.params.id;

        function _proceed() {

            const data = req.body;

            const form = {
                _forAdd: [''], // '+r, +w, +d'
                _forRemove: [''] // '-r, -w, -d'
            }

            helper.validateBody(form, data, res, () => {
                _begin(data);
            });
        }

        function _begin(data) {

            database.transaction((err, conn) => {
                if (err) return helper.sendConnError(res, err, c.DATABASE_CONN_ERROR);

                _update_permission(conn, data);
            });
        }

        function _update_permission(conn, data) {

            const _forAdd = data.forAdd;
            const _forRemove = data.forRemove;

            _remove_permission(conn, _forRemove, modes => {
                async.map(_forAdd, __add_permission, (err, ms) => {
                    if (err) return database.rollback(conn, () => helper.send400(null, res, err, c.PERMISSION_UPDATE_FAILED));

                    _load_resource(conn);
                });
            });

            function __add_permission(mode, next) {

                const form = {
                    role_id: 'uuid',
                    resource_id: 'uuid',
                    mode: '',
                    is_disabled: 0
                }

                const accessObj = { role_id: roleId, resource_id: resourceId, mode: mode }; // mode: '+r, +w, +d'
                const accessObjEnabled = { ...accessObj, is_disabled: 0 };

                const set_query = database.format(form, accessObjEnabled);
                const query = `INSERT INTO permission SET ${set_query}
                    ON DUPLICATE KEY UPDATE ${set_query}`;

                conn.query(query, (err, rows) => {
                    if (err) return next(err);

                    return next(null, mode);
                });
            }
        }

        function _remove_permission(conn, modes, next) {
            if (!modes || modes.length === 0) return next(modes || []);

            const query = `UPDATE permission SET is_disabled = 1
                WHERE role_id = ${database.uuidToBIN(roleId)} AND resource_id = ${database.uuidToBIN(resourceId)} AND mode IN (?)`;

            conn.query(query, [modes], (err, rows) => {
                if (err) return database.rollback(conn, () => helper.send400(null, res, err, c.PERMISSION_UPDATE_FAILED));

                return next(modes || []);
            });
        }

        function _load_resource(conn) {

            const fields = [
                'r.*',
                database.binToUUID('r.id', 'id')
            ].join(', ');

            const query = `SELECT ${fields} FROM resource r
                WHERE r.id = ${database.uuidToBIN(resourceId)}`;

            conn.query(query, (err, rows) => {
                if (err || rows.length === 0) return database.rollback(conn, () => helper.send400(null, res, err, c.PERMISSION_UPDATE_FAILED));

                _load_permission(conn, roleId, rows[0]);
            });
        }

        function _load_permission(conn, roleId, resource) {

            const fields = [
                database.binToUUID('r.id', 'role_id'),
                'r.name AS role_name',
                'r.description AS role_description',
                database.binToUUID('s.id', 'resource_id'),
                's.name AS resource_name',
                's.description AS resource_description',
                's.deleted AS resource_disabled',
                'p.mode AS access_mode',
                'p.is_disabled AS access_disabled',
                'p.timestamp AS timestamp'
            ].join(', ');

            const query = `SELECT ${fields} FROM role r
                INNER JOIN permission p ON p.role_id = r.id
                INNER JOIN resource s ON s.id = p.resource_id
                WHERE s.id = ${database.uuidToBIN(resourceId)} AND p.role_id = ${database.uuidToBIN(roleId)}`;

            conn.query(query, (err, rows) => {
                if (err) return database.rollback(conn, () => helper.send400(null, res, err, c.PERMISSION_UPDATE_FAILED));

                _success_response(conn, { resource, permissions: rows });
            });
        }

        function _success_response(conn, data) {

            database.commit(conn, err => {
                if (err) return helper.send400(null, res, err, c.PERMISSION_UPDATE_FAILED);

                helper.send200(null, res, data, c.PERMISSION_UPDATE_SUCCESS);
            });
        }

        _proceed();
    }

    function retrieve_permission(req, res) {

        const roleId  = req.params.roleId;
        const q       = req.query.q;
        const deleted = req.query.deleted;

        const limit   = Number(req.query.limit) || c.LIMIT;
        const page    = (Number(req.query.page) || 1);
        const offset  = (page - 1) * limit;
        const order   = req.query.order || c.ORDER;

        function _proceed() {

            database.connection((err, conn) => {
                if (err) return helper.sendConnError(res, err, c.DATABASE_CONN_ERROR);

                _get_item_count(conn);
            });
        }

        function _get_item_count(conn) {

            let query = `SELECT COUNT(s.id) AS item_count FROM resource s`;
            let where = [], values = [];

            if (deleted) {
                where.push(`s.deleted = ?`);
                values.push(deleted);
            }

            if (q) {
                where.push(`LOWER(s.name) LIKE LOWER(?)`);
                values.push(`%${q}%`);
            }

            if (where.length > 0) {
                query += ` WHERE ${where.join(' AND ')}`;
            }

            conn.query(query, values, (err, rows) => {
                if (err) return helper.send400(conn, res, err, c.RESOURCE_FETCH_FAILED);

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
                's.*',
                database.binToUUID('s.id', 'id')
            ].join(', ');

            let query = `SELECT ${fields} FROM resource s`;
            let where = [], values = [];

            if (deleted) {
                where.push(`s.deleted = ?`);
                values.push(deleted);
            }

            if (q) {
                where.push(`LOWER(s.name) LIKE LOWER(?)`);
                values.push(`%${q}%`);
            }

            if (where.length > 0) {
                query += ` WHERE ${where.join(' AND ')}`;
            }

            if (order.isEqualToStr('desc')) {
                query += ` ORDER BY s.name ${order}`;
            }else{
                query += ` ORDER BY s.name`;
            }

            if (limit > 0) {
                query += ' LIMIT ? OFFSET ?';
                values.push(limit, offset);
            }

            conn.query(query, values, (err, rows) => {
                if (err) return helper.send400(conn, res, err, c.RESOURCE_FETCH_FAILED);

                data.items = rows;
                _load_permission(conn, data);
            });
        }

        function _load_permission(conn, data) {

            const resources = data.hasOwnProperty('items') ? data.items : data;

            async.map(resources, __load_permission, (err, permissions) => {
                if (err) return helper.send400(conn, res, err, c.RESOURCE_FETCH_FAILED);

                // send response
                if (data.hasOwnProperty('items')) {
                    data.items = permissions;
                    _success_response(conn, data);
                }else{
                    _success_response(conn, permissions);
                }
            });

            function __load_permission(element, next) {

                const fields = [
                    database.binToUUID('r.id', 'role_id'),
                    'r.name AS role_name',
                    'r.description AS role_description',
                    database.binToUUID('s.id', 'resource_id'),
                    's.name AS resource_name',
                    's.description AS resource_description',
                    's.deleted AS resource_disabled',
                    'p.mode AS access_mode',
                    'p.is_disabled AS access_disabled',
                    'p.timestamp AS timestamp'
                ].join(', ');

                const query = `SELECT ${fields} FROM role r
                    INNER JOIN permission p ON p.role_id = r.id
                    INNER JOIN resource s ON s.id = p.resource_id
                    WHERE s.id = ${database.uuidToBIN(element.id)} AND p.role_id = ${database.uuidToBIN(roleId)}`;

                conn.query(query, (err, rows) => {
                    if (err) return next(err);

                    const resource = {
                        resource: element,
                        permissions: rows
                    }

                    return next(null, resource);
                });
            }
        }

        function _success_response(conn, data) {

            helper.send200(conn, res, data, c.RESOURCE_FETCH_SUCCESS);
        }

        _proceed();
    }

    return {
        add_resource,
        update_resource,
        retrieve_resource,
        retrieve_resources,
        enable_resource,
        disable_resource,

        set_permission,
        retrieve_permission
    }
};