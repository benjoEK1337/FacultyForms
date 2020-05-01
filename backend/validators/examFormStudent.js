const { check, validationResult } = require('express-validator');

const studentExamFormValidationRules = () => {
  return [
    check('currentYearOfStudy', 'Current year of study is not valid')
      .notEmpty()
      .isInt()
      .isIn([1, 2, 3, 4]),

    check('currentSemestar', 'Current semester is not valid')
      .notEmpty()
      .isInt(),

    check('currentAcademicYear', 'Current academic year is not valid')
      .notEmpty()
      .contains('/')
      .isString(),
    check('subjectName', 'Subject name is not valid').notEmpty().isString(),
    check(
      'firstTimeListenedAcademicYear',
      'The year when you first time listened subject is not valid'
    )
      .notEmpty()
      .contains('/')
      .isString(),
    check(
      'firstTimeListenedSemester',
      'The semester when you first time listened subject is not valid'
    )
      .notEmpty()
      .isInt()
      .isIn([1, 2, 3, 4, 5, 6, 7, 8]),

    check('professorExaminer', 'Name of professor examiner is not valid')
      .notEmpty()
      .isString(),
  ];
};

const validateStudentExamForm = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  return res.status(400).json({
    errors: errors.array({ onlyFirstError: true }),
  });
};

module.exports = {
  studentExamFormValidationRules,
  validateStudentExamForm,
};
