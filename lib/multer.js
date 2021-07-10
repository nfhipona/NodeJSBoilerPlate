'use strict';

const helper        = require(__dirname + '/../helper/helper.js');

const os            = require('os');
const fs            = require('fs');
const path          = require('path');
const multer        = require('multer');

/**
 * MULTER SETTINGS
 */
 exports.imageFilter = function (req, file, cb) {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
        const response_message = helper.errMsgData(400, 'Unsupported file type.');
        return cb(response_message, false);
    }
    cb(null, true);
};

exports.config = (folder_path, filter) => {
    const tempPath  = `${os.tmpdir()}/${folder_path}`;
    fs.mkdirSync(tempPath, { recursive: true }); // creates temp dir if does not exists to prevent errors
    
    // Ex. of .file
    // {
    //     fieldname: 'avatar',
    //     originalname: 'FILE_NAME.png',
    //     encoding: '7bit',
    //     mimetype: 'image/png'
    // }
    const diskStorage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, tempPath);
        },
        filename: function (req, file, cb) {
            const extension = path.extname(file.originalname);
            const filename = `${file.fieldname}-${Date.now()}${extension}`;
            cb(null, filename);
        }
    });

    const upload = multer({ storage: diskStorage, fileFilter: filter });
    return upload;
}