'use strict';

/** AUTH TOKEN */
exports.TOKEN_MAX_EXPIRY = 60 * 60 * 24 * 7 // 7d - user tokens
exports.TOKEN_MIN_EXPIRY = 60 * 60 * 2 // 2h - registration token...

exports.USER_TOKEN = 'user_token';
exports.REGISTRATION_TOKEN = 'registration_token';
exports.RESET_PW_TOKEN = 'reset_password_token';

/** DEFAULT QUERY LIMIT */
exports.LIMIT = 0;
exports.DELETED = '0';
exports.ORDER = 'DESC';

/** SERVER */
exports.SERVER_WELCOME      = "Welcome, the server is up and running"
exports.SERVER_NO_CONTENT   = "No Content"
exports.SERVER_UP_STATUS    = 'SERVER_UP';
exports.SERVER_DOWN_STATUS  = 'SERVER_DOWN';
exports.SERVER_MAINTENANCE  = 'The server is currently undergoing system maintenance. Please try again later.';

/** APP RESOURCES */
exports.RESOURCE_CREATE_FAILED = 'Could not create resource';
exports.RESOURCE_CREATE_SUCCESS = 'Resource added';
exports.RESOURCE_UPDATE_FAILED = 'Could not update resource';
exports.RESOURCE_UPDATE_SUCCESS = 'Resource updated';
exports.RESOURCE_FETCH_FAILED = 'Could not fetch resource';
exports.RESOURCE_FETCH_SUCCESS = 'Resource fetched';
exports.RESOURCE_DISABLE_FAILED = 'Could not disable resource';
exports.RESOURCE_DISABLE_SUCCESS = 'Resource disabled';
exports.RESOURCE_ENABLE_FAILED = 'Could not enable resource';
exports.RESOURCE_ENABLE_SUCCESS = 'Resource enabled';

/** APP PERMISSION */
exports.PERMISSION_CREATE_FAILED = 'Could not create resource permission';
exports.PERMISSION_CREATE_SUCCESS = 'Resource permission added';
exports.PERMISSION_UPDATE_FAILED = 'Could not update resource permission';
exports.PERMISSION_UPDATE_SUCCESS = 'Resource permission updated';
exports.PERMISSION_DELETE_FAILED = 'Could not delete resource permission';
exports.PERMISSION_DELETE_SUCCESS = 'Resource permission deleted';
exports.PERMISSION_FETCH_FAILED = 'Could not fetch resource permission';
exports.PERMISSION_FETCH_SUCCESS = 'Resource permission fetched';

/** APP MAINTENANCE */
exports.MAINTENANCE_INFO_FETCH_FAILED = 'Could not retrieve maintenance information';
exports.MAINTENANCE_INFO_FETCH_SUCCESS = 'Maintenance information retrieved';
exports.MAINTENANCE_SET_FAILED = 'Could not set maintenance window';
exports.MAINTENANCE_SET_SUCCESS = 'Maintenance window active';
exports.MAINTENANCE_HISTORY_FETCH_FAILED = 'Could not fetch maintenance history';
exports.MAINTENANCE_HISTORY_FETCH_SUCCESS = 'Maintenance history fetched';

/** ROLE */
exports.ROLE_CREATE_FAILED = 'Could not create role';
exports.ROLE_CREATE_SUCCESS = 'Role created';
exports.ROLE_UPDATE_FAILED = 'Could not update role';
exports.ROLE_UPDATE_SUCCESS = 'Role updated';
exports.ROLE_FETCH_FAILED = 'Could not fetch roles';
exports.ROLE_FETCH_SUCCESS = 'Roles fetched';
exports.ROLE_DELETE_FAILED = 'Could not delete roles';
exports.ROLE_DELETE_SUCCESS = 'Roles deleted';

/** PERMISSION **/
exports.PERMISSION_DENIED           = 'Permission denied';
exports.UNAUTHORIZED_REQUEST        = 'Unauthorized request';
exports.SERVER_ERROR                = 'Server error';
exports.DATABASE_CONN_ERROR         = 'Connection error';
exports.SERVICE_UNAVAILABLE         = 'Service unavailable';
exports.FORBIDDEN_REQUEST           = 'Forbidden request';
exports.BAD_PARAMETERS              = 'Bad parameters';

/** USER */
exports.USER_SIGNIN_FAILED          = 'Invalid email/username and/or password';
exports.USER_SIGNIN_SUCCESS         = 'Signed in success';
exports.USER_SIGNED_OUT             = 'You have logged out';
exports.USER_CREATE_FAILED          = 'Could not create user';
exports.USER_CREATE_SUCCESS         = 'User created';
exports.USER_ACTIVATION_SUCCESS     = 'User activated';
exports.USER_ACTIVATION_FAILED      = 'User activation failed';
exports.USER_CHANGE_PW_SUCCESS      = 'User password changed';
exports.USER_CHANGE_PW_FAILED       = 'User password change failed';
exports.USER_FORGOT_PW_SUCCESS      = 'User password reset request';
exports.USER_FORGOT_PW_FAILED       = 'User password reset request failed';
exports.USER_ACCOUNT_CREATE_SUCCESS = 'User account created';
exports.USER_ACCOUNT_CREATE_FAILED  = 'User account create failed';

exports.UPLOAD_SUCCESS              = 'Upload success'
exports.UPLOAD_ERROR                = 'Upload failed'