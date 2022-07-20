--
-- NOTE: Holds the entire database structure
--


DROP DATABASE IF EXISTS boilerplatedb;
CREATE DATABASE boilerplatedb;
USE boilerplatedb;

--
-- Table structure for table `role`
--
DROP TABLE IF EXISTS `role`;
CREATE TABLE `role` (
    `id` binary(16) NOT NULL,
    `code` varchar(255) NOT NULL,
    `name` varchar(255) NOT NULL,
    `description` varchar(255),

    `deleted` tinyint(1) NOT NULL DEFAULT 0,
    `updatedAt` timestamp NOT NULL DEFAULT CURRENt_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT `role_id_pk` PRIMARY KEY (`id`),
    CONSTRAINT `role_code_u_key` UNIQUE (`code`)
);

--
-- Table structure for table `resource`
--
DROP TABLE IF EXISTS `resource`;
CREATE TABLE `resource` (
    `id` binary(16) NOT NULL,
    `name` varchar(150) NOT NULL COMMENT 'resource access name',
    `code` varchar(255) NOT NULL COMMENT 'resource access unique code',
    `description` varchar(255) NULL,

    `deleted` tinyint(1) NOT NULL DEFAULT 0,
    `updatedAt` timestamp NOT NULL DEFAULT CURRENt_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT `resource_id_pk` PRIMARY KEY (`id`)
);

--
-- Table structure for table `permission`
--
DROP TABLE IF EXISTS `permission`;
CREATE TABLE `permission` (
    `role_id` binary(16) NOT NULL,
    `resource_id` binary(16) NOT NULL,
    `mode` varchar(5) NOT NULL COMMENT '+r, +w, +d',

    `is_disabled` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'No entry means access disabled',

    `updatedAt` timestamp NOT NULL DEFAULT CURRENt_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT `permission_mode_u_key` UNIQUE INDEX (`role_id`, `resource_id`, `mode`),
    CONSTRAINT `permission_role_id_fk` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`) ON DELETE CASCADE,
    CONSTRAINT `permission_resource_id_fk` FOREIGN KEY (`resource_id`) REFERENCES `resource` (`id`) ON DELETE CASCADE
);

--
-- Table structure for table `maintenance`
--
DROP TABLE IF EXISTS `maintenance`;
CREATE TABLE `maintenance` (
    `id` bigint(10) unsigned NOT NULL,

    `title` varchar(255) NOT NULL,
    `description` varchar(255) DEFAULT '',
    `message` text,
    `is_down` tinyint(1) NOT NULL DEFAULT 0 COMMENT '1 - SERVER_DOWN | 0 - SERVER_UP',

    `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT `maintenance_id_pk` PRIMARY KEY (`id`)
);

--
-- Table structure for table `maintenance_history`
--
DROP TABLE IF EXISTS `maintenance_history`;
CREATE TABLE `maintenance_history` (
    `id` binary(16) NOT NULL,

    `title` varchar(255) NOT NULL,
    `description` varchar(255) DEFAULT '',
    `message` text,
    `status` varchar(20) NOT NULL DEFAULT 0 COMMENT '1 - SERVER_DOWN | 0 - SERVER_UP',

    `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT `maintenance_history_id_pk` PRIMARY KEY (`id`)
);

--
-- Table structure for table `user`
--
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
    `id` binary(16) NOT NULL,
    `role_id` binary(16),

    `email` varchar(100) NOT NULL,
    `password` varchar(255) NOT NULL,
    `ivHex` varchar(255) NOT NULL COMMENT 'Initialization vector iv key',
    `activated` tinyint(1) NOT NULL DEFAULT 0,

    `deleted` tinyint(1) NOT NULL DEFAULT 0,
    `updatedAt` timestamp NOT NULL DEFAULT CURRENt_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT `user_id_pk` PRIMARY KEY (`id`),
    CONSTRAINT `user_email_u_key` UNIQUE (`email`),
    CONSTRAINT `user_role_id_fk` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`) ON DELETE CASCADE
);

--
-- Table structure for table `account`
--
DROP TABLE IF EXISTS `account`;
CREATE TABLE `account` (
    `user_id` binary(16) NOT NULL,

    `prefix` varchar(25) COMMENT 'Mr/Ms, Dr' COMMENT 'Optional name field',
    `suffix` varchar(25) COMMENT 'Sr/Jr, PhD, IV' COMMENT 'Optional name field',

    `first_name` varchar(100),
    `middle_name` varchar(100) COMMENT 'Optional name field',
    `last_name` varchar(100),
    `avatar` varchar(255) COMMENT 'avatar`s filename',
    `avatar_url` varchar(255) COMMENT 'avatar`s file url',

    `title` varchar(100),
    `position` varchar(100),

    `mobile` varchar(20),
    `website` varchar(255),

    `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT `account_user_id_pk` PRIMARY KEY (`user_id`),
    CONSTRAINT `account_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE
);

--
-- Table structure for table `audit_log`
--
DROP TABLE IF EXISTS `audit_log`;
CREATE TABLE `audit_log` (
    `id` binary(16) NOT NULL,
    `user_id` binary(16) NULL,

    `message` varchar(255) NOT NULL,

    `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT `audit_log_id_pk` PRIMARY KEY (`id`),
    CONSTRAINT `audit_log_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE
);