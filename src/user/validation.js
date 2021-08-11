const { body, validationResult } = require('express-validator');
const UserService = require('./userService');

const passwordRules = () =>
  body('password')
    .notEmpty()
    .withMessage('Password must have at least 6 characters')
    .bail()
    .isLength({ min: 6, max: 18 })
    .withMessage('Password must have between 6 and 18 characters')
    .bail()
    .matches(/^(?=.*[A-Za-z])(?=.*d)[A-Za-zd@$!%*#?&]*/)
    .withMessage(
      'Password must have at least 1 lowercase, 1 uppercase and 1 number'
    );

const emailRules = () =>
  body('email')
    .notEmpty()
    .withMessage('Email cannot be empty')
    .bail()
    .normalizeEmail()
    .isEmail()
    .withMessage('Must be a valid email')
    .bail()
    .custom(async (email) => {
      const user = await UserService.findByEmail(email);
      if (user) {
        throw new Error('Email already in use');
      }
    });

const usernameRules = () =>
  body('username')
    .notEmpty()
    .withMessage('Username must have at least 4 characters')
    .bail()
    .isLength({ min: 4, max: 32 })
    .withMessage('Username must have between 4 and 32 characters');

const userValidationRules = () => [
  usernameRules(),
  emailRules(),
  passwordRules(),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const extractedErrors = {};
  // eslint-disable-next-line no-return-assign
  errors.array().map((err) => (extractedErrors[err.param] = err.msg));
  return res.status(400).json({
    validationErrors: extractedErrors,
  });
};

module.exports = {
  userValidationRules,
  validate,
};
