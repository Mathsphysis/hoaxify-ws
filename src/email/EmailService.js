const transporter = require('../config/emailTransporter');

const sendAccountActivation = async (user) => {
  await transporter.sendMail({
    from: 'My App <info@my-app.com>',
    to: `${user.username} <${user.email}>`,
    subject: 'account_activation',
    html: `Token is ${user.activationToken}`,
  });
};

module.exports = {
  sendAccountActivation,
};
