const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

const auth = require('../../middleware/auth');
const isProfessor = require('../../middleware/isProfessor');
const isStudent = require('../../middleware/isStudent');

const {
  studentExamFormValidationRules,
  validateStudentExamForm,
} = require('../../validators/examFormStudent');

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
  studentExamFormValidationRules(),
  validateStudentExamForm,
  async (req, res) => {
    let {
      currentYearOfStudy,
      currentSemestar,
      currentAcademicYear,
      subjectName,
      firstTimeListenedAcademicYear,
      firstTimeListenedSemester,
      professorExaminer,
    } = req.body;

    let examFormFields = {};

    examFormFields.student = req.user.id;
    examFormFields.currentYearOfStudy = currentYearOfStudy;
    examFormFields.currentSemestar = currentSemestar;
    examFormFields.currentAcademicYear = currentAcademicYear;
    examFormFields.subjectName = subjectName;
    examFormFields.firstTimeListenedAcademicYear = firstTimeListenedAcademicYear;
    examFormFields.firstTimeListenedSemester = firstTimeListenedSemester;
    examFormFields.professorExaminer = professorExaminer;

    try {
      // Search for professor
      let professor = await Professor.findOne({
        fname: professorExaminer.split(' ')[0],
        lname: professorExaminer.split(' ')[1],
      });

      // If professor doesn't exist or if the subject in form is not the one that professor teach
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

      // Check if form exist
      let examForm = await Examform.findOne({
        student: req.user.id,
        currentSemestar,
        currentAcademicYear,
        subjectName,
      }).populate('student', ['fname', 'lname', 'indexNumber']);

      // Making new examForm if it doesn't exist
      if (!examForm) {
        // get the last inserted document and give it's _id incremented to new exam form
        const lastForm = await Examform.find().limit(1).sort({ $natural: -1 });
        if (!lastForm[0]) _id = 1;
        else _id = lastForm[0]._id + 1;
        examFormFields._id = _id;

        examForm = new Examform(examFormFields);
        await examForm.save();

        examForm = await Examform.findOne({
          _id,
        }).populate('student', ['fname', 'lname', 'indexNumber']);
        return res.status(200).json(examForm);
      }

      // If logged in students id doesn't match searched exam form owner
      if (examForm.student.toString() !== req.user.id)
        return res.status(401).json({ msg: 'Not authorized' });

      // If exists update
      examForm = await Examform.findOneAndUpdate(
        {
          student: req.user.id,
          currentSemestar,
          currentAcademicYear,
          subjectName,
        },
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
    check('grade', 'Grade is not valid.').notEmpty().isIn([6, 7, 8, 9, 10]),
    check('_id', 'Application number is not valid.').notEmpty().isInt(),
    check('dateOfExam', 'Date of Exam is not valid.').notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ errors: errors.array({ onlyFirstError: true }) });
    }

    const { grade, _id, dateOfExam } = req.body;

    try {
      let examForm = await Examform.findOne({
        _id,
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
