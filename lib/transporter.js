'use strict';

const nodemailer    = require('nodemailer');
const config        = require(__dirname + '/../config/config.js');
const helper        = require(__dirname + '/../helper/helper.js');
const isDev         = config.isDev();

module.exports = prepareMailer();

async function createTransporter() {
    if (isDev) {
        // Generate test SMTP service account from ethereal.email
        // Only needed if you don't have a real mail account for testing
        const testAccount = await nodemailer.createTestAccount();
        helper.log(testAccount, "NODEMAILER");

        // create reusable transporter object using the default SMTP transport
        const transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: testAccount.user, // generated ethereal user
                pass: testAccount.pass, // generated ethereal password
            },
        });

        return transporter;
    } else {
        const transporterSettings = config.transporterSettings();
        const transporter = nodemailer.createTransport(transporterSettings);
        return transporter;
    }
}

function prepareMailer() {
    const sendMail = async (options, cb) => {
        const transporter = await createTransporter();
        transporter.sendMail(options, (err, info) => {
            if (err) {
                const err_res = { info, error: helper.checkError(err) };
                cb(false, err_res);
            } else {
                cb(true, { info });
            }
        });
    }

    const sendOnly = (options) => sendMail(options);

    return {
        sendMail,
        sendOnly
    }
}
