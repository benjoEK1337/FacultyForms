const { check, validationResult } = require('express-validator');

const professorProfileValidationRules = () => {
  return [
    check('fname', 'First name is not valid.').notEmpty().isString(),
    check('lname', 'Last name is not valid.').notEmpty().isString(),
    check('faculty', 'Faculty is not valid.').notEmpty().isString(),
    check('academicRank', 'Academic Rank is not valid.').notEmpty().isString(),
    check('subjects', 'Subjects are not valid.').notEmpty().isArray(),
  ];
};

const validateProfessorProfile = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  return res.status(400).json({
    errors: errors.array({ onlyFirstError: true }),
  });
};

module.exports = {
  professorProfileValidationRules,
  validateProfessorProfile,
};
