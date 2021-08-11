const express = require('express');
const { body, validationResult } = require('express-validator');
const UserService = require('./userService');

const router = express.Router();

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

router.post(
  '/api/v1/users',
  body('username')
    .notEmpty()
    .withMessage('Username must have at least 4 characters')
    .bail()
    .isLength({ min: 4, max: 32 })
    .withMessage('Username must have between 4 and 32 characters'),
  body('email')
    .notEmpty()
    .withMessage('Email cannot be empty')
    .bail()
    .normalizeEmail()
    .isEmail({ require_tld: false })
    .withMessage('Must be a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password must have at least 6 characters')
    .bail()
    .isLength({ min: 6, max: 18 })
    .withMessage('Password must have between 6 and 18 characters'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const validationErrors = {};
      errors
        .array()
        // eslint-disable-next-line no-return-assign
        .forEach((error) => (validationErrors[error.param] = error.msg));
      return res.status(400).send({ validationErrors });
    }
    await UserService.save(req.body);
    return res.send({
      message: 'User created',
    });
  }
);

module.exports = router;
