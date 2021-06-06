'use strict';

const aclJS                 = require(__dirname + '/acl.js'); // Auth - resource access
const userJS                = require(__dirname + '/../controller/user.js');
const c                     = require(__dirname + '/../config/constant.js');

const path                  = require('path');
const os                    = require('os');
const multer                = require('multer');

const upload_tmp            = multer({ dest: os.tmpdir() });

module.exports = (api, database, auth) => {


    /** ACL MATRIX */
    const a                 = aclJS(database);
    const acl               = a.acl;
    const login_check       = a.login_check;
    const is_maintenance    = a.is_maintenance;

    /** USER **/
    const user              = userJS(database, auth);

    api.post    ('/users/signin',                                   user.signin,                                    login_check('user_account', 'r')); // will validate if server is under maintenance
    api.post    ('/users/signup',                                   is_maintenance,                                 user.signup,);
    
}