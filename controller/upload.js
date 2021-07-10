'use strict';

const helper        = require(__dirname + '/../helper/helper.js');
const c             = require(__dirname + '/../config/constant.js');
const config        = require(__dirname + '/../config/config.js');
const multer        = require(__dirname + '/../lib/multer.js');

const imagePath     = config.imagePath;
const imageFilter   = multer.imageFilter;
const imageUpload   = multer.config(imagePath.path, imageFilter);

module.exports = (database, auth) => {

    function avatar_upload(req, res) {
        const decoded = req.get('decoded_token');
        
        function _upload() {
            const uploader = imageUpload.single('avatar');

            uploader(req, res, err => { // handle file upload
                if (err) return helper.send400(null, res, err, c.UPLOAD_FAILED);

                // add aws upload
                _save_avatar(req.file);
            });
        }

        function _save_avatar(file) {
            database.connection((err, conn) => {
                if (err) return helper.sendError(conn, res, err, c.DATABASE_CONN_ERROR);

                _account_exist(conn, file)
            });
        }

        function _account_exist(conn, file) {
            const query = `SELECT * FROM account
                WHERE user_id = ${database.uuidToBIN}`;

            conn.query(query, [decoded.id], (err, rows) => {
                if (err) return helper.send400(null, res, err, c.UPLOAD_FAILED);

                const name = `avatar-${decoded.id}`;
                const extension = multer.fileExtension(file.originalname);
                const filename = multer.fileName(name, extension);
                file.filename = filename;

                rows.length > 0 ? _update_account(conn, file) : _bind_avatar(conn, file);
            });
        }

        function _update_account(conn, file) {
            const query = `UPDATE account \
                    SET avatar = ? \
                    WHERE user_id = ${database.uuidToBIN}`;
                
            conn.query(query, [file.filename, decoded.id], (err, rows) => {
                if (err || rows.affectedRows === 0) return helper.send400(conn, res, err, c.UPLOAD_FAILED);

                _success_response(conn, file);
            });
        }

        function _bind_avatar(conn, file) {
            const fields = [
                `user_id = ${database.uuidToBIN}`,
                `avatar = ?`
            ].join(', ');
            
            const query = `INSERT INTO account \
                SET ${fields}`;

            conn.query(query, [decoded.id, file.filename], (err, rows) => {
                if (err || rows.affectedRows === 0) return helper.send400(conn, res, err, c.UPLOAD_FAILED);

                _success_response(conn, file);
            });
        }

        function _success_response(conn, file) {
            const response_message = { message: 'File has been uploaded', filename: file.filename };
            helper.send200(conn, res, response_message, c.UPLOAD_SUCCESS);
        }

        _upload();
    }

    return {
        avatar_upload
    }
}