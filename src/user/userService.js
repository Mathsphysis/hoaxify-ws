const bcrypt = require('bcrypt');
const crypto = require('crypto');
const User = require('./user');
const emailService = require('../email/emailService');

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
  await emailService.sendActivationEmail(emailUser);
  const savedUser = await User.create(user);
  return savedUser;
};

const findByEmail = async (email) => {
  const user = await User.findOne({ where: { email } });
  if (user) {
    return user;
  }

  return false;
};

module.exports = { save, findByEmail };
