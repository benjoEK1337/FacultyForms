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

    console.log(professorExaminer);

    let examFormFields = {};
    let professor;

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
      // trim for empty spaces beetwen and at the end and beggining.
      professorExaminer = professorExaminer
        .replace(/^\s+|\s+$/g, '')
        .replace(/\s+/g, ' ');

      let professorExaminerSplited = professorExaminer.split(' ');

      if (professorExaminerSplited.length === 2) {
        professor = await Professor.findOne({
          fname: professorExaminerSplited[0],
          lname: professorExaminerSplited[1],
        });
      }

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
      if (examForm.student.id.toString() !== req.user.id)
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

// @route   DELETE api/examforms
// @desc    Delete exam form
// @access  Private
router.delete(
  '/',
  auth,
  isStudent,
  [check('_id', 'ID is not valid.').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ errors: errors.array({ onlyFirstError: true }) });
    }

    const { _id } = req.body;

    try {
      let examForm = await Examform.findOneAndRemove({
        _id,
        student: req.user.id,
      });
      if (!examForm) {
        return res.status(400).json({ msg: 'Exam form not found.' });
      }
      res.json({ msg: 'Your exam form is deleted!' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

module.exports = router;

// @route   GET api/examforms/professor
// @desc    Searching for exam forms
// @access  Private
router.get(
  '/professor',
  auth,
  isProfessor,
  [check('subjectName', 'Subject Name is required.').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ errors: errors.array({ onlyFirstError: true }) });
    }

    let {
      subjectName,
      studentName,
      grade,
      indexNumber,
      currentAcademicYear,
    } = req.body;

    let student;
    let fname, lname;
    let studentNameSplited;
    let professor = req.user.id;

    // Removing white space
    if (studentName) {
      studentName = studentName.replace(/^\s+|\s+$/g, '').replace(/\s+/g, ' ');

      studentNameSplited = studentName.split(' ');

      if (studentNameSplited.length === 2) {
        fname = studentNameSplited[0];
        lname = studentNameSplited[1];
      } else {
        return res.status(400).json({ msg: 'Student name is not valid.' });
      }
    }

    // Setting object properties depending on what professor filled out about student for search
    const queryStudentConditions = {
      ...(fname && { fname }),
      ...(lname && { lname }),
      ...(indexNumber && { indexNumber }),
    };

    try {
      // Checking if professor didn't give info about student
      const checkIfEmpty = obj => Object.keys(obj).length === 0;
      let isEmpty = checkIfEmpty(queryStudentConditions);

      if (!isEmpty) {
        let studentFromConditions = await Student.findOne(
          queryStudentConditions
        );

        if (studentFromConditions) student = studentFromConditions.id;
        else
          return res
            .status(400)
            .json({ msg: "Student with that info doesn't exist." });
      }

      // Setting Conditions for search for exam form
      const queryExamFormConditions = {
        ...(subjectName && { subjectName }),
        ...(currentAcademicYear && { currentAcademicYear }),
        ...(grade && { grade }),
        ...(student && { student }),
        ...(professor && { professor }),
      };

      let examForm = await Examform.find(
        queryExamFormConditions
      ).populate('student', ['fname', 'lname', 'indexNumber']);

      // Checking If there are not forms with info that professor provided
      if (examForm.length === 0)
        return res.status(400).json({ msg: 'Exam forms not found!' });

      return res.json(examForm);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);
