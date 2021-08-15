const nodemailer = require('nodemailer');
const nodemailerStub = require('nodemailer-stub');

const sendActivationEmail = async (user) => {
  const transporter = nodemailer.createTransport(nodemailerStub.stubTransport);
  await transporter.sendMail({
    from: 'My App <info@my-app.com>',
    to: `${user.username} <${user.email}>`,
    subject: 'account_activation',
    html: `Token is ${user.activationToken}`,
  });
};

module.exports = {
  sendActivationEmail,
};
