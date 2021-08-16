const bcrypt = require('bcrypt');
const crypto = require('crypto');
const User = require('./user');
const emailService = require('../email/emailService');
const sequelize = require('../config/database');
const EmailException = require('../email/EmailException');

const ACTIVATION_TOKEN_LENGTH = 16;

const generateToken = (length) =>
  crypto.randomBytes(length).toString('hex').substring(0, length);

const save = async (body) => {
  const { username, email, password, inactive } = body;

  const hash = await bcrypt.hash(password, 10);
  const activationToken = generateToken(ACTIVATION_TOKEN_LENGTH);
  const user = {
    username,
    email,
    password: hash,
    inactive,
    activationToken,
  };
  const emailUser = { username, email, activationToken };
  const transaction = await sequelize.transaction();
  const savedUser = await User.create(user, { transaction });
  try {
    await emailService.sendAccountActivation(emailUser);
    await transaction.commit();
    return savedUser;
  } catch (err) {
    await transaction.rollback();
    throw new EmailException();
  }
};

const activate = async (token) => {
  const user = await User.findOne({ where: { activationToken: token } });
  user.inactive = false;
  await user.save();
};

const findByEmail = async (email) => {
  const user = await User.findOne({ where: { email } });
  if (user) {
    return user;
  }

  return false;
};

module.exports = { save, findByEmail, activate };
