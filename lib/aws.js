'use strict';

const config        = require(__dirname + '/../config/config.js');
const AWS           = require('aws-sdk');
const fs            = require('fs');

const awsConfig     = config.awsConfig;
const bucketConfig  = config.awsBucket;
const bucketPath    = config.awsBucketPath;

/**
 * 
 * @param {object} creds credential object
 * @param {string} creds.accessKeyId aws access id
 * @param {string} creds.secretAccessKey aws secret key
 */
exports.initAWS = (creds = awsConfig) => { // using env.config
    AWS.config.update({
        accessKeyId: creds.accessKeyId,
        secretAccessKey: creds.secretAccessKey,
        region: bucketConfig.region
    });

    return loadAWSFunctions();
}

/**
 * 
 * @param {string} profile aws-cli local shared ini profile
 */
exports.initAWSUsingSharedIniFile = (profile = awsConfig.profile) => { // using shared file -- aws-cli local config
    const credentials   = new AWS.SharedIniFileCredentials({ profile });
    AWS.config.credentials = credentials;
    
    return loadAWSFunctions();
}

/**
 * AWS FUNCTIONS
 */
function loadAWSFunctions() {
    // new s3 object
    const s3 = awsConfig.apiVersion ? new AWS.S3({ apiVersion: awsConfig.apiVersion }) : new AWS.S3();

    /**
     * 
     * @param {*} cb callback -> (err, data)
     */
    function checkCredentials(cb) { // local aws-cli env config
        AWS.config.getCredentials(err => {
            if (err) return cb(err);
            cb(null, AWS.config.credentials);
        });
    }

    /**
     * 
     * @param {*} name bucket name
     * @param {*} cb callback -> (err, data)
     */
    function s3CreateBucket(name, cb) {
        // call S3 to create the bucket
        s3.createBucket({ Bucket: name }, cb);
    }

    /**
     * 
     * @param {*} cb callback -> (err, data)
     */
    function s3ListBuckets(cb) {
        // Call S3 to list the buckets
        s3.listBuckets(cb);
    }

    /**
     * 
     * @param {*} name bucket name
     * @param {*} cb callback -> (err, data)
     */
    function s3DeleteBucket(name, cb) {
        // Call S3 to obtain a list of the objects in the bucket
        s3.deleteBucket({ Bucket: name }, cb);
    }

    /**
     * 
     * @param {*} key file name
     * @param {*} file_path file source path
     * @param {*} cb callback -> (err, data)
     */
    function s3Upload(key, file_path, cb) {
        // call S3 to retrieve upload file to specified bucket
        const uploadParams = {
            Bucket: bucketConfig.bucket,
            Key: key,
            Body: fs.createReadStream(file_path)
        };

        // call S3 to retrieve upload file to specified bucket
        s3.upload(uploadParams, (err, data) => {
            fs.unlinkSync(file_path); // remove temp file
            cb(err, data);
        });
    }

    /**
     * 
     * @param {*} bucket bucket name
     * @param {*} key file name
     * @param {*} file_path file source path
     * @param {*} cb callback -> (err, data)
     */
    function s3UploadTo(bucket, key, file_path, cb) {
        // call S3 to retrieve upload file to specified bucket
        const uploadParams = {
            Bucket: bucket,
            Key: key,
            Body: fs.createReadStream(file_path)
        };

        // call S3 to retrieve upload file to specified bucket
        s3.upload(uploadParams, (err, data) => {
            fs.unlinkSync(file_path); // remove temp file
            cb(err, data);
        });
    }

    /**
     * 
     * @param {*} name bucket name
     * @param {*} cb callback -> (err, data)
     */
    function s3ListObjects(name, cb) {
        // Call S3 to obtain a list of the objects in the bucket
        s3.listObjects({ Bucket: name }, cb);
    }

    /**
     * 
     * @param {*} fileNamePath file path name folder/filename.extension
     * @param {*} cb callback -> (err, data)
     */
    function s3DeleteObject(fileNamePath, cb) {
        const params = { 
            Bucket: bucketConfig.bucket,
            Key: fileNamePath
        };

        s3.deleteObject(params, cb);
    }

    /**
     * 
     * @param {*} bucket bucket name
     * @param {*} fileNamePath file path name folder/filename.extension
     * @param {*} cb callback -> (err, data)
     */
    function s3DeleteObjectFrom(bucket, fileNamePath, cb) {
        const params = { 
            Bucket: bucket, 
            Key: fileNamePath
        };

        s3.deleteObject(params, cb);
    }

    return {
        checkCredentials,
        s3CreateBucket,
        s3ListBuckets,
        s3DeleteBucket,
        s3Upload,
        s3UploadTo,
        s3ListObjects,
        s3DeleteObject,
        s3DeleteObjectFrom
    }
}