'use strict';

const aclJS                 = require(__dirname + '/acl.js'); // Auth - resource access

const userJS                = require(__dirname + '/../controller/user.js');

const path                  = require('path');
const os                    = require('os');
const multer                = require('multer');

const upload_tmp            = multer({ dest: os.tmpdir() });

module.exports = (app, socket, database, auth) => {


    /** ACL MATRIX */
    const a                 = aclJS(database);
    const acl               = a.acl;
    const login_check       = a.login_check;
    const is_maintenance    = a.is_maintenance;

    /** USER **/
    const user              = userJS(database, auth);

    app.post    ('/users/signin',                                   user.signin,                                    login_check('user_account', 'r')                                                                            ); // will validate if server is under maintenance
    app.post    ('/users/signup',                                   is_maintenance('user_account', 'r'),            user.signup,                                                                                                );
}