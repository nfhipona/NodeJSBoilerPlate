--
-- NOTE: Holds the sample data for staging development
--

USE boilerplatedb;

--
-- Data for table `role`
--
SET @supID = UUID_TO_BIN(UUID(), 1);
SET @sysID = UUID_TO_BIN(UUID(), 1);
SET @stdID = UUID_TO_BIN(UUID(), 1);

INSERT INTO `role` (`id`, `code`, `name`) VALUES
(@supID, 'sup_admin', 'Super Admin'),
(@sysID, 'sys_admin', 'System Admin'),
(@stdID, 'std_user', 'Default User');

--
-- Data for table `resource`
--
SET @resource = UUID_TO_BIN(UUID(), 1);
SET @maintenance = UUID_TO_BIN(UUID(), 1);
SET @user_management = UUID_TO_BIN(UUID(), 1);
SET @user_account = UUID_TO_BIN(UUID(), 1);
SET @media_resource = UUID_TO_BIN(UUID(), 1);

INSERT INTO `resource` (`id`, `code`, `name`, `description`) VALUES
(@resource, 'resource', 'App Resources', 'App resources management, set resource permissions'),
(@maintenance, 'maintenance', 'Maintenance settings', 'Server maintenance management'),
(@user_management, 'user_management', 'User Management', 'User account management'),
(@user_account, 'user_account', 'User Account', 'User account management'),
(@media_resource, 'media_resource', 'Media Resource Config', 'Media files management config');

--
-- Data for table `permission`
--
INSERT INTO `permission` (`role_id`, `resource_id`, `mode`, `is_disabled`) VALUES
-- sup_admin
(@supID, @resource, 'r', 0), -- resource
(@supID, @resource, 'w', 0),
(@supID, @resource, 'd', 0),
(@supID, @maintenance, 'r', 0), -- maintenance
(@supID, @maintenance, 'w', 0),
(@supID, @maintenance, 'd', 0),
(@supID, @user_management, 'r', 0), -- user_management
(@supID, @user_management, 'w', 0),
(@supID, @user_management, 'd', 0),
(@supID, @user_account, 'r', 0), -- user_account
(@supID, @user_account, 'w', 0),
(@supID, @user_account, 'd', 0),
(@supID, @media_resource, 'r', 0), -- media_resource
(@supID, @media_resource, 'w', 0),
(@supID, @media_resource, 'd', 0),

-- sys_admin
(@sysID, @resource, 'r', 0), -- resource
(@sysID, @resource, 'w', 1),
(@sysID, @resource, 'd', 1),
(@sysID, @maintenance, 'r', 0), -- maintenance
(@sysID, @maintenance, 'w', 0),
(@sysID, @maintenance, 'd', 0),
(@sysID, @user_management, 'r', 0), -- user_management
(@sysID, @user_management, 'w', 0),
(@sysID, @user_management, 'd', 0),
(@sysID, @user_account, 'r', 0), -- user_account
(@sysID, @user_account, 'w', 0),
(@sysID, @user_account, 'd', 0),
(@sysID, @media_resource, 'r', 0), -- media_resource
(@sysID, @media_resource, 'w', 0),
(@sysID, @media_resource, 'd', 0),

-- std_user
(@stdID, @maintenance, 'r', 0), -- maintenance
(@stdID, @maintenance, 'w', 1),
(@stdID, @maintenance, 'd', 1),
(@stdID, @user_management, 'r', 1), -- user_management
(@stdID, @user_management, 'w', 1),
(@stdID, @user_management, 'd', 1),
(@stdID, @user_account, 'r', 0), -- user_account
(@stdID, @user_account, 'w', 0),
(@stdID, @user_account, 'd', 0),
(@stdID, @media_resource, 'r', 0), -- media_resource
(@stdID, @media_resource, 'w', 0),
(@stdID, @media_resource, 'd', 0);

--
-- Data for table `user`
--
SET @supUID = UUID_TO_BIN(UUID(), 1);
SET @stdUID = UUID_TO_BIN(UUID(), 1);

INSERT INTO `user` (`id`, `role_id`, `email`, `password`, `activated`) VALUES
(@supUID, @supID, 'adminuser@gmail.com', '$2b$10$g2qOdl.ldIaxRPNa0YPrpeHBmQMwT3eXL6MqnpmEN4KGZjOOLN2LO', 1),
(@stdUID, @stdID, 'stduser@gmail.com', '$2b$10$g2qOdl.ldIaxRPNa0YPrpeHBmQMwT3eXL6MqnpmEN4KGZjOOLN2LO', 1);

--
-- Data for table `account`
--
INSERT INTO `account` (`user_id`, `first_name`, `last_name`) VALUES
(@supUID, 'neil francis', 'hipona'),
(@stdUID, 'standard', 'user');

--
-- Data for table `audit_log`
--
INSERT INTO `audit_log` (`id`, `user_id`, `message`) VALUES
(UUID_TO_BIN(UUID(), 1), NULL, 'Initiate seed data'),
(UUID_TO_BIN(UUID(), 1), @supUID, 'Created super admin user'),
(UUID_TO_BIN(UUID(), 1), @stdUID, 'Created standard user');