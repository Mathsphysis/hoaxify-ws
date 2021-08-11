const express = require('express');
const { body, validationResult } = require('express-validator');
const UserService = require('./userService');

const router = express.Router();

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

router.post(
  '/api/v1/users',
  body('username').notEmpty().withMessage('Username cannot be null'),
  body('email').notEmpty().withMessage('Email cannot be null'),
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
