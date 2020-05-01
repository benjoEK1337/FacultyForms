const { check, validationResult, checkSchema } = require('express-validator');

var Schema = {
  role: {
    in: 'body',
    matches: {
      options: [/\b(?:Student|Professor)\b/],
      errorMessage:
        'Please include a valid role. Role could be Student or Professor',
    },
  },
};

const registrationValidationRules = () => {
  return [
    check('fname', 'First name is not valid.').notEmpty().isString(),
    check('lname', 'Last name is not valid.').notEmpty().isString(),
    check('email', 'Email is not valid.').isEmail(),
    check(
      'password',
      'Please enter a password with 6 or more characters'
    ).isLength({ min: 6 }),
    checkSchema(Schema),
  ];
};

const validateRegistration = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  return res.status(400).json({
    errors: errors.array({ onlyFirstError: true }),
  });
};

module.exports = {
  registrationValidationRules,
  validateRegistration,
};
