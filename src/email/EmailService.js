const transporter = require('../config/emailTransporter');

const sendAccountActivation = async (user) => {
  const info = await transporter.sendMail({
    from: 'My App <info@my-app.com>',
    to: `${user.username} <${user.email}>`,
    subject: 'account_activation',
    html: `
    <div>
      <b>Please click the link below to activate your account</b>
    </div>
    <div>
      <a href="http://localjost:8080/#/login?token=${user.activationToken}">Activate</a>
    </div>
    Token is ${user.activationToken}`,
  });
  if (process.env.NODE_ENV === 'dev') {
    // eslint-disable-next-line no-console
    console.log(info);
  }
};

module.exports = {
  sendAccountActivation,
};
