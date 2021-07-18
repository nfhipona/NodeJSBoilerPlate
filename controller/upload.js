'use strict';

const helper        = require(__dirname + '/../helper/helper.js');
const c             = require(__dirname + '/../config/constant.js');
const config        = require(__dirname + '/../config/config.js');
const multer        = require(__dirname + '/../lib/multer.js');
const awsJS         = require(__dirname + '/../lib/aws.js');

const imagePath     = config.imagePath;
const imageFilter   = multer.imageFilter;
const imageUpload   = multer.config(imagePath.path, imageFilter);
const aws           = awsJS.initAWS(); // use default env.config

module.exports = (database, auth) => {

    function avatar_upload(req, res) {
        const decoded = req.get('decoded_token');
        
        function _upload() {
            const uploader = imageUpload.single('avatar');

            uploader(req, res, err => { // handle file upload
                if (err) return helper.send400(null, res, err, c.UPLOAD_FAILED);

                const file = req.file;
                const name = `avatar-${decoded.id}`;
                const extension = multer.fileExtension(file.originalname);
                const aws_folder = `${decoded.id}/images`;
                const filename = multer.fileName(name, extension);
                const aws_filepath = `${aws_folder}/${filename}`;
                file.filename_aws = filename;
                file.filepath_aws = aws_filepath;

                aws.s3Upload(filename, file.path, (err, data) => {
                    if (err) return helper.send400(null, res, err, c.UPLOAD_FAILED);

                    // proceed to data bind
                    file.fileurl = data.Location;
                    _save_avatar(file);
                });
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
                rows.length > 0 ? _update_account(conn, file) : _bind_avatar(conn, file);
            });
        }

        function _update_account(conn, file) {
            const fields = [
                `avatar = ?`,
                `avatar_url = ?`
            ].join(', ');

            const query = `UPDATE account \
                SET ${fields} \
                WHERE user_id = ${database.uuidToBIN}`;
                
            conn.query(query, [file.filename_aws, file.fileurl, decoded.id], (err, rows) => {
                if (err || rows.affectedRows === 0) return helper.send400(conn, res, err, c.UPLOAD_FAILED);

                _success_response(conn, file);
            });
        }

        function _bind_avatar(conn, file) {
            const fields = [
                `user_id = ${database.uuidToBIN}`,
                `avatar = ?`,
                `avatar_url = ?`
            ].join(', ');
            
            const query = `INSERT INTO account \
                SET ${fields}`;

            conn.query(query, [decoded.id, file.filename_aws, file.fileurl], (err, rows) => {
                if (err || rows.affectedRows === 0) return helper.send400(conn, res, err, c.UPLOAD_FAILED);

                _success_response(conn, file);
            });
        }

        function _success_response(conn, file) {
            const response_message = { message: 'File has been uploaded', filename: file.filename_aws };
            helper.send200(conn, res, response_message, c.UPLOAD_SUCCESS);
        }

        _upload();
    }

    return {
        avatar_upload
    }
}