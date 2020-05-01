const { check, validationResult } = require('express-validator');

const studentProfileValidationRules = () => {
  return [
    check('fname', 'First name is not valid.').notEmpty().isString(),
    check('lname', 'Last name is not valid.').notEmpty().isString(),
    check('faculty', 'Faculty is not valid.').notEmpty().isString(),
    check('fieldOfStudy', 'Field of study is not valid.').notEmpty().isString(),
    check('indexNumber', 'Index number is not valid.').notEmpty().isString(),
  ];
};

const validateStudentProfile = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  return res.status(400).json({
    errors: errors.array({ onlyFirstError: true }),
  });
};

module.exports = {
  studentProfileValidationRules,
  validateStudentProfile,
};
