'use strict';

const aclJS                 = require(__dirname + '/acl.js'); // Auth - resource access
const resourceJs            = require(__dirname + '/../controller/resource.js');
const roleJS                = require(__dirname + '/../controller/role.js');
const maintenanceJS         = require(__dirname + '/../controller/maintenance.js');
const c                     = require(__dirname + '/../config/constant.js');

module.exports = (api, database, auth) => {

    /** ACL MATRIX */
    const acl               = aclJS(database).acl;

    /** APP RESOURCES AND PERMISSIONS **/
    const resource          = resourceJs(database, auth);

    // resources
    api.post    ('/resources',                                      auth.verifyToken(c.USER_TOKEN),              acl('resource', 'w'),                                           resource.add_resource                   );
    api.put     ('/resources/:id',                                  auth.verifyToken(c.USER_TOKEN),              acl('resource', 'w'),                                           resource.update_resource                );
    api.put     ('/resources/:id/enabled',                          auth.verifyToken(c.USER_TOKEN),              acl('resource', 'w'),                                           resource.enable_resource                );
    api.put     ('/resources/:id/disabled',                         auth.verifyToken(c.USER_TOKEN),              acl('resource', 'w'),                                           resource.disable_resource               );
    api.get     ('/resources',                                      auth.verifyToken(c.USER_TOKEN),              acl('resource', 'r'),                                           resource.retrieve_resources             );
    api.get     ('/resources/:id',                                  auth.verifyToken(c.USER_TOKEN),              acl('resource', 'r'),                                           resource.retrieve_resource              );

    // permissions
    api.put     ('/resources/:id/:roleId/permissions',              auth.verifyToken(c.USER_TOKEN),              acl('resource', 'w'),                                           resource.set_permission                 );
    api.get     ('/resources/:roleId/permissions',                  auth.verifyToken(c.USER_TOKEN),              acl('resource', 'r'),                                           resource.retrieve_permission            );

    /** ROLES */
    const role              = roleJS(database);

    api.post    ('/roles',                                          auth.verifyToken(c.USER_TOKEN),              acl('resource', 'w'),                                           role.create                             );
    api.put     ('/roles/:id',                                      auth.verifyToken(c.USER_TOKEN),              acl('resource', 'w'),                                           role.update                             );
    api.get     ('/roles/:id',                                      auth.verifyToken(c.USER_TOKEN),              acl('resource', 'r'),                                           role.fetch_one                          );
    api.get     ('/roles',                                          auth.verifyToken(c.USER_TOKEN),              acl('resource', 'r'),                                           role.fetch_multiple                     );
    api.delete  ('/roles/:id',                                      auth.verifyToken(c.USER_TOKEN),              acl('resource', 'd'),                                           role.remove                             );

    /** APP MAINTENANCE */
    const maintenance       = maintenanceJS(database);

    api.put     ('/maintenance',                                    auth.verifyToken(c.USER_TOKEN),              acl('maintenance', 'w', true),                                  maintenance.set                         );
    api.get     ('/maintenance',                                    auth.verifyToken(c.USER_TOKEN),              acl('maintenance', 'r', true),                                  maintenance.info                        );
    api.get     ('/maintenance/history',                            auth.verifyToken(c.USER_TOKEN),              acl('maintenance', 'r', true),                                  maintenance.retrieve_history            );

};