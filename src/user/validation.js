const { body, validationResult } = require('express-validator');
const UserService = require('./userService');

const passwordRules = () =>
  body('password')
    .notEmpty()
    .withMessage('password_null')
    .bail()
    .isLength({ min: 6, max: 18 })
    .withMessage('password_size')
    .bail()
    .matches(/^(?=.*[A-Za-z])(?=.*d)[A-Za-zd@$!%*#?&]*/)
    .withMessage('password_pattern');

const emailRules = () =>
  body('email')
    .notEmpty()
    .withMessage('email_null')
    .bail()
    .normalizeEmail()
    .isEmail()
    .withMessage('email_invalid')
    .bail()
    .custom(async (email) => {
      const user = await UserService.findByEmail(email);
      if (user) {
        throw new Error('email_inuse');
      }
    });

const usernameRules = () =>
  body('username')
    .notEmpty()
    .withMessage('username_null')
    .bail()
    .isLength({ min: 4, max: 32 })
    .withMessage('username_size');

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
  errors.array().map((err) => (extractedErrors[err.param] = req.t(err.msg)));
  req.validationErrors = extractedErrors;
  return next();
};

module.exports = {
  userValidationRules,
  validate,
};
