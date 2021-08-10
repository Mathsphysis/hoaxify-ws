const bcrypt = require('bcrypt');
const User = require('./user');

const save = async (userPlain) => {
  const hash = await bcrypt.hash(userPlain.password, 10);
  const user = { ...userPlain, password: hash };
  await User.create(user);
  return true;
};

module.exports = { save };
