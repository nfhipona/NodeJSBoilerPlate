'use strict';

const helper        = require(__dirname + '/../helper/helper.js');
const c             = require(__dirname + '/../config/constant.js');
const config        = require(__dirname + '/../config/config.js');

const imagePath     = config.imagePath;
const imageFilter   = config.imageFilter;
const imageUpload   = config.multer(imagePath.path, imageFilter);

module.exports = (database, auth) => {

    function avatar_upload(req, res) {
        function _upload() {
            const uploader = imageUpload.single('avatar');
            uploader(req, res, err => {
                if (err) return helper.send400(null, res, err, c.UPLOAD_ERROR);

                const response_message = { message: 'File has been uploaded' };
                helper.send200(null, res, response_message, c.UPLOAD_SUCCESS);
            });
        }

        _upload();
    }

    return {
        avatar_upload
    }
}