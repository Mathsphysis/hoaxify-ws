const bcrypt = require('bcrypt');
const crypto = require('crypto');
const User = require('./user');

const ACTIVATION_TOKEN_LENGTH = 16;

const generateToken = (length) =>
  crypto.randomBytes(length / 2).toString('hex');

const save = async (body) => {
  const { username, email, password, inactive } = body;

  const hash = await bcrypt.hash(password, 10);
  const user = {
    username,
    email,
    password: hash,
    inactive,
    activationToken: generateToken(ACTIVATION_TOKEN_LENGTH),
  };
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
