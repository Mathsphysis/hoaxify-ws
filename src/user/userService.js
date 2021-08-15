const bcrypt = require('bcrypt');
const User = require('./user');

const save = async (body) => {
  const { username, email, password, inactive } = body;

  const hash = await bcrypt.hash(password, 10);
  const user = { username, email, password: hash, inactive };
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
