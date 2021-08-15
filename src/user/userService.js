const bcrypt = require('bcrypt');
const User = require('./user');

const save = async (userPlain) => {
  const hash = await bcrypt.hash(userPlain.password, 10);
  const user = { ...userPlain, password: hash };
  const { username, email } = await User.create(user);
  const savedUser = { username, email };
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
