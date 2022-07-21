const config        = require(__dirname + '/../config/config.js');
const helper        = require(__dirname + '/../helper/helper.js');

const cryptoConf    = config.cryptoConfig;
const crypto        = require('crypto');

exports.encrypt = (subject, cb) => {  
    // First, we'll generate the key. The key length is dependent on the algorithm.
    // In this case for aes192, it is 24 bytes (192 bits).

    crypto.scrypt(cryptoConf.password, cryptoConf.salt, cryptoConf.byteLength, (err, key) => {
        if (err) cb(err);

        // Then, we'll generate a random initialization vector
        crypto.randomFill(new Uint8Array(16), (err, iv) => {
            if (err) cb(err);
            
            const cipher = crypto.createCipheriv(cryptoConf.algorithm, key, iv);        
            let encrypted = cipher.update(subject, 'utf8', 'hex');
            encrypted += cipher.final('hex');

            let ivHex = iv.toString();
            cb(null, { ivHex, encrypted });
        });
    });
}

exports.decrypt = ({ ivHex, encrypted }, cb) => {
    // Key length is dependent on the algorithm. In this case for aes192, it is
    // 24 bytes (192 bits).
    crypto.scrypt(cryptoConf.password, cryptoConf.salt, cryptoConf.byteLength, (err, key) => {
        if (err) cb(err);
        let iv = new Uint8Array(ivHex.split(','));
        const decipher = crypto.createDecipheriv(cryptoConf.algorithm, key, iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        cb(null, decrypted);
    });
}