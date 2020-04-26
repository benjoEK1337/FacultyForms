const nodemailer = require('nodemailer');
const config = require('config');

module.exports = smtpTransport = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: config.get('EMAIL'),
    pass: config.get('PASSWORD'),
  },
});
