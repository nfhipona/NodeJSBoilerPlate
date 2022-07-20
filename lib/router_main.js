'use strict';

const c                     = require(__dirname + '/../config/constant.js');
const aclJS                 = require(__dirname + '/acl.js'); // Auth - resource access
const userJS                = require(__dirname + '/../controller/user.js');
const mediaJS               = require(__dirname + '/../controller/media.js');

module.exports = (api, database, auth) => {


    /** ACL MATRIX */
    const a                 = aclJS(database);
    const acl               = a.acl;
    const login_check       = a.login_check;
    const is_maintenance    = a.is_maintenance;

    /** USER **/
    const user              = userJS(database, auth);

    api.post    ('/users/signin',                                   is_maintenance,                                 user.signin);
    api.post    ('/users/signup',                                   is_maintenance,                                 user.signup);
    api.post    ('/users/signup_n_login',                           is_maintenance,                                 user.signup_n_login);
    api.post    ('/users/confirm',                                  is_maintenance,                                 auth.verifyToken(c.REGISTRATION_TOKEN),                     user.confirm);
    api.patch   ('/users/change_pw',                                is_maintenance,                                 auth.verifyToken(c.USER_TOKEN),                             user.change_pw);
    api.post    ('/users/forgot_pw',                                is_maintenance,                                 user.forgot_pw);
    api.patch   ('/users/confirm_pw',                               is_maintenance,                                 auth.verifyToken(c.RESET_PW_TOKEN),                         user.confirm_pw);
    api.put     ('/users/accounts',                                 auth.verifyToken(c.USER_TOKEN),                 acl('user_account', 'w'),                                   user.create_account);
    api.patch   ('/users/accounts',                                 auth.verifyToken(c.USER_TOKEN),                 acl('user_account', 'w'),                                   user.update_account);

    /** UPLOAD */
    const media             = mediaJS(database, auth);

    api.put     ('/uploads/avatar',                                 auth.verifyToken(c.USER_TOKEN),                 acl('media_resource', 'w'),                                 media.upload_avatar);
}