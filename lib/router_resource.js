'use strict';

const aclJS                 = require(__dirname + '/acl.js'); // Auth - resource access
const resourceJs            = require(__dirname + '/../controller/resource.js');
const roleJS                = require(__dirname + '/../controller/role.js');
const maintenanceJS         = require(__dirname + '/../controller/maintenance.js');

module.exports = (app, database, auth) => {

    /** ACL MATRIX */
    const acl               = aclJS(database).acl;

    /** APP RESOURCES AND PERMISSIONS **/
    const resource          = resourceJs(database, auth);

    // resources
    app.post    ('/resources',                                      auth.verifyToken('user_token'),              acl('resource', 'w'),                                           resource.add_resource                   );
    app.put     ('/resources/:id',                                  auth.verifyToken('user_token'),              acl('resource', 'w'),                                           resource.update_resource                );
    app.put     ('/resources/:id/enabled',                          auth.verifyToken('user_token'),              acl('resource', 'w'),                                           resource.enable_resource                );
    app.put     ('/resources/:id/disabled',                         auth.verifyToken('user_token'),              acl('resource', 'w'),                                           resource.disable_resource               );
    app.get     ('/resources',                                      auth.verifyToken('user_token'),              acl('resource', 'r'),                                           resource.retrieve_resources             );
    app.get     ('/resources/:id',                                  auth.verifyToken('user_token'),              acl('resource', 'r'),                                           resource.retrieve_resource              );

    // permissions
    app.put     ('/resources/:id/:roleId/permissions',              auth.verifyToken('user_token'),              acl('resource', 'w'),                                           resource.set_permission                 );
    app.get     ('/resources/:roleId/permissions',                  auth.verifyToken('user_token'),              acl('resource', 'r'),                                           resource.retrieve_permission            );

    /** ROLES */
    const role              = roleJS(database);

    app.post    ('/roles',                                          auth.verifyToken('user_token'),              acl('resource', 'w'),                                           role.create                             );
    app.put     ('/roles/:id',                                      auth.verifyToken('user_token'),              acl('resource', 'w'),                                           role.update                             );
    app.get     ('/roles/:id',                                      auth.verifyToken('user_token'),              acl('resource', 'r'),                                           role.fetch_one                          );
    app.get     ('/roles',                                          auth.verifyToken('user_token'),              acl('resource', 'r'),                                           role.fetch_multiple                     );
    app.delete  ('/roles/:id',                                      auth.verifyToken('user_token'),              acl('resource', 'd'),                                           role.remove                             );

    /** APP MAINTENANCE */
    const maintenance       = maintenanceJS(database);

    app.put     ('/maintenance',                                    auth.verifyToken('user_token'),              acl('maintenance', 'w', true),                                  maintenance.set                         );
    app.get     ('/maintenance',                                    auth.verifyToken('user_token'),              acl('maintenance', 'r', true),                                  maintenance.info                        );
    app.get     ('/maintenance/history',                            auth.verifyToken('user_token'),              acl('maintenance', 'r', true),                                  maintenance.retrieve_history            );

};