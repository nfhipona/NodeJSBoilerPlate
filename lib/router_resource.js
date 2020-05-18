'use strict';

const aclJS                 = require(__dirname + '/acl.js'); // Auth - resource access
const resourceJs            = require(__dirname + '/../controllers/resource.js');
const roleJS                = require(__dirname + '/../controllers/role.js');
const maintenanceJS         = require(__dirname + '/../controllers/maintenance.js');

module.exports = (app, socket, database, auth) => {

    /** ACL MATRIX */
    const acl               = aclJS(database).acl;

    /** APP RESOURCES AND PERMISSIONS **/
    const resource          = resourceJs(database, auth);

    // resources
    app.post    ('/resources',                                      auth.validate_token('user_token'),              acl('resource', 'w'),                                           resource.add_resource                   );
    app.put     ('/resources/:id',                                  auth.validate_token('user_token'),              acl('resource', 'w'),                                           resource.update_resource                );
    app.put     ('/resources/:id/enabled',                          auth.validate_token('user_token'),              acl('resource', 'w'),                                           resource.enable_resource                );
    app.put     ('/resources/:id/disabled',                         auth.validate_token('user_token'),              acl('resource', 'w'),                                           resource.disable_resource               );
    app.get     ('/resources',                                      auth.validate_token('user_token'),              acl('resource', 'r'),                                           resource.retrieve_resources             );
    app.get     ('/resources/:id',                                  auth.validate_token('user_token'),              acl('resource', 'r'),                                           resource.retrieve_resource              );

    // permissions
    app.put     ('/resources/:id/:roleId/permissions',              auth.validate_token('user_token'),              acl('resource', 'w'),                                           resource.set_permission                 );
    app.get     ('/resources/:roleId/permissions',                  auth.validate_token('user_token'),              acl('resource', 'r'),                                           resource.retrieve_permission            );

    /** ROLES */
    const role              = roleJS(database);

    app.post    ('/roles',                                          auth.validate_token('user_token'),              acl('resource', 'w'),                                           role.create                             );
    app.put     ('/roles/:id',                                      auth.validate_token('user_token'),              acl('resource', 'w'),                                           role.update                             );
    app.get     ('/roles',                                          auth.validate_token('user_token'),              acl('resource', 'r'),                                           role.fetch_multiple                     );
    app.delete  ('/roles/:id',                                      auth.validate_token('user_token'),              acl('resource', 'w'),                                           role.remove                             );

    /** APP MAINTENANCE */
    const maintenance       = maintenanceJS(database);

    app.put     ('/maintenance',                                    auth.validate_token('user_token'),              acl('maintenance', 'w', true),                                  maintenance.set                         );
    app.get     ('/maintenance',                                    auth.validate_token('user_token'),              acl('maintenance', 'r', true),                                  maintenance.info                        );
    app.get     ('/maintenance/history',                            auth.validate_token('user_token'),              acl('maintenance', 'r', true),                                  maintenance.retrieve_history            );

};