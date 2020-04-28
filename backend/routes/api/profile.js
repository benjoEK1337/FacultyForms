const express = require('express');
const router = express.Router();
const { check, validationResult, checkSchema } = require('express-validator');
const auth = require('../../middleware/auth');
const isProfessor = require('../../middleware/isProfessor');
const isStudent = require('../../middleware/isStudent');

const Student = require('../../models/Student');
const Professor = require('../../models/Professor');

// @route   POST api/profile/student/info
// @desc    Upate profile
// @access  Private
router.post(
  '/student/info',
  auth,
  isStudent,
  [
    check('fname', 'First name is required').not().isEmpty(),
    check('lname', 'Last name is required').not().isEmpty(),
    check('fieldOfStudy', 'Field of study is required').not().isEmpty(),
    check('indexNumber', 'Index number is required').not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
    }

    try {
      const { fname, lname, fieldOfStudy, indexNumber } = req.body;
      const profileFields = {};

      profileFields.fname = fname;
      profileFields.lname = lname;
      profileFields.fieldOfStudy = fieldOfStudy;
      profileFields.indexNumber = indexNumber;

      let student = await Student.findById(req.user.id).select('-password');

      if (student) {
        student = await Student.findOneAndUpdate(
          { _id: req.user.id },
          { $set: profileFields },
          { new: true }
        );
        return res.json(student);
      }
    } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
    }
  }
);

// @route   POST api/profile/professor/info
// @desc    Upate profile
// @access  Private
router.post(
  '/professor/info',
  auth,
  isProfessor,
  [
    check('fname', 'First name is required').not().isEmpty(),
    check('lname', 'Last name is required').not().isEmpty(),
    check('academicRank', 'Academic Rank is required').not().isEmpty(),
    check('subjects', 'Subjects are required').not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
    }

    try {
      const { fname, lname, academicRank, subjects } = req.body;
      const profileFields = {};

      profileFields.fname = fname;
      profileFields.lname = lname;
      profileFields.academicRank = academicRank;
      profileFields.subjects = subjects;

      let professor = await Professor.findById(req.user.id);

      if (professor) {
        professor = await Professor.findOneAndUpdate(
          { _id: req.user.id },
          { $set: profileFields },
          { new: true }
        );
        return res.json(professor);
      }
    } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
    }
  }
);

// @route   POST api/profile/password
// @desc    Change password
// @access  Private

module.exports = router;
