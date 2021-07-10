'use strict';

require("dotenv").config();

const helper        = require(__dirname + '/../helper/helper.js');
const pjson         = require(__dirname + '/../package.json');

const fs            = require('fs');
const path          = require('path');

process.env.NODE_ENV = process.env.NODE_ENV || 'staging';
const env = process.env;

helper.log(`NODE_ENV: ${env.NODE_ENV} -- version: ${pjson.version}`);

/**
 * ENV FLAGS
 */
exports.isDebug = () => {
    const isDev = env.NODE_ENV.toLocaleLowerCase() === 'development' || env.NODE_ENV.toLocaleLowerCase() === 'staging';
    return isDev;
}

exports.isDev = () => {
    const isDev = env.NODE_ENV.toLocaleLowerCase() === 'development';
    return isDev;
}

exports.isStage = () => {
    const isStage = env.NODE_ENV.toLocaleLowerCase() === 'staging';
    return isStage;
}

/**
 * DATABASE CONFIG
 */
const dbDevelopment         = helper.parseSettingsConfig(env.DATABASE_DEV_URL);
const dbDevelopmentTest     = helper.parseSettingsConfig(env.DATABASE_DEV_TEST_URL);
const dbStaging             = helper.parseSettingsConfig(env.DATABASE_STAGING_URL);
const dbProduction          = helper.parseSettingsConfig(env.DATABASE_PRODUCTION_URL);
exports.dbConfigAll = {
    development: dbDevelopment,
    development_test: dbDevelopmentTest,
    staging: dbStaging,
    production: dbProduction,
    use: () => {
        const config = this.dbConfigAll[env.NODE_ENV];
        return config;
    }
}

exports.dbConfig            = this.dbConfigAll.use();
exports.dbTestConfig        = this.isDev() ? this.dbConfigAll['development'] : this.dbConfigAll['development_test'];

/**
 * CERT SETTINGS
 */
let key, cert;
const keyFile = 'certificate.key';
const cerFile = 'certificate.crt';

try {
    key = fs.readFileSync(path.resolve(`../certificate-files/${keyFile}`));
} catch (err) {
    helper.log(`Server SSL key not found: ${keyFile}`);
}

try {
    cert = fs.readFileSync(path.resolve(`../certificate-files/${cerFile}`));
} catch (err) {
    helper.log(`Server SSL cert not found: ${cerFile}`);
}

exports.certificate         = { key: key, cert: cert };

/**
 * ENV SETTINGS
 */
exports.serverConfig        = helper.parseSettingsConfig(env.SERVER_CONFIG);
exports.jwtConfig           = helper.parseSettingsConfig(env.JWT_CONFIG);
exports.socketConfig        = helper.parseSettingsConfig(env.SOCKET_CONFIG);
exports.redisConfig         = helper.parseSettingsConfig(env.REDIS);

exports.mailAuth            = helper.parseSettingsConfig(env.MAIL_AUTH);
exports.mailConfig          = helper.parseSettingsConfig(env.MAIL_CONFIG);

exports.development         = helper.parseSettingsConfig(env.DEVELOPMENT_ENV);
exports.staging             = helper.parseSettingsConfig(env.STAGING_ENV);
exports.production          = helper.parseSettingsConfig(env.PRODUCTION_ENV);

exports.imagePath           = helper.parseSettingsConfig(env.IMAGE_FILE_PATH);

const envDevelopment        = helper.parseSettingsConfig(env.DEVELOPMENT_ENV);
const envStaging            = helper.parseSettingsConfig(env.STAGING_ENV);
const envProduction         = helper.parseSettingsConfig(env.PRODUCTION_ENV);
exports.envConfig = {
    development: envDevelopment,
    staging: envStaging,
    production: envProduction,
    use: (type) => {
        const config = this.envConfig[env.NODE_ENV];
        return config[type];
    },
    test: (host = 'http://127.0.0.1', port = '7746') => {
        return `${host}:${port}`;
    }
}

/**
 * AWS SETTINGS
 */
const awsDevelopment        = helper.parseSettingsConfig(env.AWS_CONFIG_DEV);
const awsStaging            = helper.parseSettingsConfig(env.AWS_CONFIG_STAGING);
const awsProduction         = helper.parseSettingsConfig(env.AWS_CONFIG_PRODUCTION);
exports.awsEnvConfig = {
    development: awsDevelopment,
    staging: awsStaging,
    production: awsProduction,
    use: () => {
        const config = this.awsEnvConfig[env.NODE_ENV];
        return config;
    }
}
exports.awsConfig           = this.awsEnvConfig.use();

const awsBucketDevelopment  = helper.parseSettingsConfig(env.AWS_BUCKET_DEV);
const awsBucketStaging      = helper.parseSettingsConfig(env.AWS_BUCKET_STAGING);
const awsBucketProduction   = helper.parseSettingsConfig(env.AWS_BUCKET_PRODUCTION);
exports.awsBucketConfig = {
    development: awsBucketDevelopment,
    staging: awsBucketStaging,
    production: awsBucketProduction,
    use: () => {
        const config = this.awsBucketConfig[env.NODE_ENV];
        return config;
    }
}
exports.awsBucket           = this.awsBucketConfig.use();
exports.awsBucketPath       = helper.parseSettingsConfig(env.AWS_BUCKET_PATH);

exports.bcryptConfig = {
    rounds: 10
};

/**
 * MAIL SETTINGS
 */
exports.mailOptionsSignUp = {
    from: `${pjson.app_name} <${this.mailAuth.user}>`,
    subject: `${pjson.app_name} - New Account`,
    html: (email, url) => {
        return `<br/>Hi ${email}, \
        <br/><br/>You applied for a new account at ${pjson.app_name}. \
        <br/><br/><b><a href=\"${url}\">Please click here to confirm your account.</a></b> \
        <br/><br/>This will expire after two hours. \
        <br/><br/>Kind regards, \
        <br/>The ${pjson.app_name} team`;
    }
}

exports.mailOptionsUserInvite = {
    from: `${pjson.app_name} <${this.mailAuth.user}>`,
    subject: (name) => {
        return `Invitation to ${name}`;
    },
    html: (email, url) => {
        return `<br/>Hi ${email}, \
        <br/><br/>You applied for a new account at ${pjson.app_name}. \
        <br/><br/><b><a href=\"${url}\">Please click here to confirm your account.</a></b> \
        <br/><br/>This will expire after two hours. \
        <br/><br/>Kind regards, \
        <br/>The ${pjson.app_name} team`;
    }
}

exports.mailOptionsPWDReset = {
    from: `${pjson.app_name} <${this.mailAuth.user}>`,
    subject: `${pjson.app_name} - Reset Password`,
    html: (email, url) => {
        return `<br/>Hi ${email}, \
        <br/><br/>Someone has requested a password reset for your account at <b>${pjson.app_name}</b>. \
        <br/><br/>If this was you please click the link below to reset your password. \
        <br/><b><a href=\"${url}\">Please click here to reset your password.</a></b> \
        <br/><br/>Kind regards, \
        <br/>The ${pjson.app_name} team`;
    }
}

exports.mailOptionsPWDResetConfirm = {
    from: `${pjson.app_name} <${this.mailAuth.user}>`,
    subject: `${pjson.app_name} - Password Changed`,
    html: (email) => {
        return `<br/>Hi ${email}, \
        <br/><br/>Your account password at <b>${pjson.app_name}</b> has been updated. \
        <br/><br/>Kind regards, \
        <br/>The ${pjson.app_name} team`;
    }
}

exports.mailOptionsConfirmedAccount = {
    from: `${pjson.app_name} <${this.mailAuth.user}>`,
    subject: `${pjson.app_name} - Welcome Aboard`,
    html: (email) => {
        return `<br/>Hi ${email}, \
        <br/><br/>Your account with <b>${pjson.app_name}</b> has been confirmed. \
        <br/><br/>Kind regards, \
        <br/>The ${pjson.app_name} team`;
    }
}

exports.transporterSettings = () => {
    let settings = helper.combineObject({}, exports.mailConfig);
    settings = helper.combineObject(settings, { auth: exports.mailAuth });
    return settings;
}

/**
 * CORS CONFIG
 */
exports.cors = {
    allow_credentials: true,
    hosts: [
        '127.0.0.1',
        'localhost',
        'yourwebsite.com',
    ],
    origins: [
        '127.0.0.1',
        'localhost',
        'yourwebsite.com'
    ],
    methods: [
        'DELETE',
        'PUT',
        'GET',
        'POST',
        'OPTIONS'
    ],
    headers: [
        'Content-Type',
        'Accept',
        'x-access-token',
        'Lang'
    ]
}