const express = require('express');
const UserService = require('./userService');

const router = express.Router();

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

router.post('/api/v1/users', async (req, res) => {
  const user = req.body;
  if (user.username === null) {
    return res.send(400);
  }

  await UserService.save(req.body);
  return res.send({
    message: 'User created',
  });
});

module.exports = router;
