'use strict';

const nodemailer    = require('nodemailer');
const config        = require(__dirname + '/../config/config.js');
const helper        = require(__dirname + '/../helper/helper.js');

module.exports = prepareMailer();

function prepareMailer() {
    const transporterSettings = config.transporterSettings();
    const transporter = nodemailer.createTransport(transporterSettings);

    const sendMail = (options, cb) => {
        transporter.sendMail(options, (err, info) => {
            if (err) {
                const err_res = { info, error: helper.checkError(err) };
                cb(false, err_res);
            } else {
                cb(true, { info });
            }
        });
    }

    const sendOnly = (options) => {
        transporter.sendMail(options);
    }

    return {
        sendMail,
        sendOnly
    }
}
