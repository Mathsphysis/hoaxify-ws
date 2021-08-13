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
    const savedUser = await UserService.save(req.body);
    return res.status(200).json({
      createdUser: savedUser,
      message: req.t('user_created'),
    });
  }
);

module.exports = router;
