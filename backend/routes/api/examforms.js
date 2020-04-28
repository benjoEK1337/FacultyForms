const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

const auth = require('../../middleware/auth');
const isProfessor = require('../../middleware/isProfessor');
const isStudent = require('../../middleware/isStudent');

const Student = require('../../models/Student');
const Professor = require('../../models/Professor');
const Examform = require('../../models/ExamForm');

// @route   POST api/examforms/student
// @desc    Upate or create exam form
// @access  Private
router.post(
  '/student',
  auth,
  isStudent,
  [
    check('currentYearOfStudy', 'Current year of study is required')
      .not()
      .isEmpty(),
    check('currentSemestar', 'Current semester is required').not().isEmpty(),
    check('currentAcademicYear', 'Current academic year is required')
      .not()
      .isEmpty(),
    check('subjectName', 'Subject name is required').not().isEmpty(),
    check(
      'firstTimeListenedYear',
      'The year when you first time listened subject is required'
    )
      .not()
      .isEmpty(),
    check(
      'firstTimeListenedSemester',
      'The semester when you first time listened subject required'
    )
      .not()
      .isEmpty(),
    check('professorExaminer', 'Name of professor examiner is required')
      .not()
      .isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
    }

    let {
      applicationNumber,
      currentYearOfStudy,
      currentSemestar,
      currentAcademicYear,
      subjectName,
      firstTimeListenedYear,
      firstTimeListenedSemester,
      professorExaminer,
    } = req.body;

    let examFormFields = {};

    if (applicationNumber !== '')
      examFormFields.applicationNumber = applicationNumber;

    examFormFields.student = req.user.id;
    examFormFields.currentYearOfStudy = currentYearOfStudy;
    examFormFields.currentSemestar = currentSemestar;
    examFormFields.currentAcademicYear = currentAcademicYear;
    examFormFields.subjectName = subjectName;
    examFormFields.firstTimeListenedYear = firstTimeListenedYear;
    examFormFields.firstTimeListenedSemester = firstTimeListenedSemester;
    examFormFields.professorExaminer = professorExaminer;

    try {
      // Search for professor
      let professor = await Professor.findOne({
        fname: professorExaminer.split(' ')[0],
        lname: professorExaminer.split(' ')[1],
      });

      if (!professor || !professor.subjects.includes(subjectName)) {
        return res.status(404).json({
          msg:
            'Professor with that name does not exist or he/she does not teach the subject you typed in.',
        });
      }

      examFormFields.professor = professor.id;

      // Check if student has more than 5 active examForms for current semester
      let populatedForms = await Examform.countDocuments({
        student: req.user.id,
        currentSemestar,
        currentAcademicYear,
      });

      if (populatedForms >= 5)
        return res
          .status(429)
          .json({ msg: 'You can only 5 forms per semester populate.' });

      const formExists = await Examform.findOne({
        student: req.user.id,
        currentSemestar,
        currentAcademicYear,
        subjectName,
      });

      if (formExists)
        return res.status(400).json({ msg: 'Form already exist.' });

      let examForm;
      if (!applicationNumber) {
        const lastForm = await Examform.find().limit(1).sort({ $natural: -1 });
        if (!lastForm[0]) applicationNumber = 1;
        else applicationNumber = lastForm[0].applicationNumber + 1;
        examFormFields.applicationNumber = applicationNumber;
      } else {
        examForm = await Examform.findOne({ applicationNumber });
      }

      if (!examForm) {
        examForm = new Examform(examFormFields);
        await examForm.save();
        examForm = await Examform.findOne({
          applicationNumber,
        }).populate('student', ['fname', 'lname', 'indexNumber']);
        return res.status(200).json(examForm);
      }

      examForm = await Examform.findOneAndUpdate(
        { applicationNumber },
        { $set: examFormFields },
        { new: true }
      ).populate('student', ['fname', 'lname', 'indexNumber']);

      res.json(examForm);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   POST api/examforms/professor
// @desc    Populate grade
// @access  Private

router.post(
  '/professor',
  auth,
  isProfessor,
  [
    check('grade', 'Grade is required').not().isEmpty(),
    check('applicationNumber', 'Application number is required')
      .not()
      .isEmpty(),
    check('dateOfExam', 'Date of Exam is required').not().isEmpty(),
  ],
  async (req, res) => {
    const { grade, applicationNumber, dateOfExam } = req.body;

    try {
      let examForm = await Examform.findOne({
        applicationNumber,
      }).populate('student', ['fname', 'lname', 'indexNumber']);

      if (!examForm)
        return res.status(404).json({ msg: 'Exam form not found' });

      if (examForm.professor.toString() !== req.user.id)
        return res.status(401).json({ msg: 'Not authorized' });

      examForm.grade = grade;
      examForm.dateOfExam = dateOfExam;
      await examForm.save();

      res.json(examForm);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

module.exports = router;
