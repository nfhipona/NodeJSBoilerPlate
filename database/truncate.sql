--
-- NOTE: Clears off staging data from database
--

USE boilerplatedb;

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE `role`;
TRUNCATE TABLE `resource`;
TRUNCATE TABLE `permission`;
TRUNCATE TABLE `maintenance`;
TRUNCATE TABLE `maintenance_history`;
TRUNCATE TABLE `user`;
TRUNCATE TABLE `account`;
TRUNCATE TABLE `audit_log`;

SET FOREIGN_KEY_CHECKS = 1;