const express = require('express');
const { userValidationRules, validate } = require('./validation');
const UserService = require('./userService');

const router = express.Router();

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

router.post(
  '/api/1.0/users',
  userValidationRules(),
  validate,
  async (req, res) => {
    const errorMessages = req.validationErrors;
    if (errorMessages !== undefined && Object.keys(errorMessages).length > 0) {
      return res.status(400).json({
        validationErrors: errorMessages,
      });
    }
    try {
      const savedUser = await UserService.save(req.body);
      return res.status(200).json({
        createdUser: savedUser,
        message: req.t('user_created'),
      });
    } catch (err) {
      return res.status(502).send({ message: req.t(err.message) });
    }
  }
);

router.post('/api/1.0/users/token/:activationtoken', async (req, res) => {
  const token = req.params.activationtoken;
  try {
    await UserService.activate(token);
    return res.send();
  } catch (err) {
    return res.status(400).send({ message: req.t(err.message) });
  }
});

module.exports = router;
