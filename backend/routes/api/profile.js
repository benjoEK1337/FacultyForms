const express = require('express');
const router = express.Router();
const { check, validationResult, checkSchema } = require('express-validator');
const bcrypt = require('bcryptjs');
const cryptoRandomString = require('crypto-random-string');

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
    check('faculty', 'Faculty is required').not().isEmpty(),
    check('fieldOfStudy', 'Field of study is required').not().isEmpty(),
    check('indexNumber', 'Index number is required').not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
    }

    const {
      fname,
      lname,
      faculty,
      fieldOfStudy,
      indexNumber,
      numberOfExamForms,
      numberOfActiveExamForms,
    } = req.body;

    const profileFields = {};

    profileFields.fname = fname;
    profileFields.lname = lname;
    profileFields.fieldOfStudy = fieldOfStudy;
    profileFields.indexNumber = indexNumber;
    profileFields.faculty = faculty;

    if (numberOfExamForms) profileFields.numberOfExamForms = numberOfExamForms;
    if (numberOfActiveExamForms)
      profileFields.numberOfActiveExamForms = numberOfActiveExamForms;

    try {
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
    check('faculty', 'Faculty is required').not().isEmpty(),
    check('academicRank', 'Academic Rank is required').not().isEmpty(),
    check('subjects', 'Subjects are required').not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
    }

    try {
      const { fname, lname, faculty, academicRank, subjects } = req.body;
      const profileFields = {};

      profileFields.fname = fname;
      profileFields.lname = lname;
      profileFields.faculty = faculty;
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
router.post(
  '/change-password',
  auth,
  [
    check('oldPassword', 'Please enter old password').not().isEmpty(),
    check(
      'newPassword',
      'Please enter a new password with 6 or more characters'
    ).isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
    }

    const { oldPassword, newPassword } = req.body;
    try {
      const COLLECTION_NAME = req.user.role === 'Student' ? Student : Professor;
      const user = await COLLECTION_NAME.findById(req.user.id);

      const isMatch = await bcrypt.compare(oldPassword, user.password);

      if (!isMatch) {
        return res.status(401).json({ msg: 'Old password does not match!' });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      await user.save();
      res.json({ msg: 'Password successfully changed!' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   POST api/profile/email
// @desc    Change email
// @access  Private
router.post(
  '/change-email',
  auth,
  [check('newEmail', 'Email is required').isEmail()],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
    }

    const { newEmail } = req.body;

    try {
      const COLLECTION_NAME = req.user.role === 'Student' ? Student : Professor;

      const user = await COLLECTION_NAME.findById(req.user.id);

      user.email = newEmail;
      user.verified = false;
      user.hash = await cryptoRandomString({ length: 128, type: 'url-safe' });

      await user.save();

      res.json({
        msg:
          'Email successfully changed. Now you have to verify your email to continue any further action!',
      });

      const link =
        'http://' + req.get('host') + '/api/register/verify/' + user.hash;
      const mailOptions = {
        to: newEmail,
        subject: 'Please confirm your Email account',
        html:
          'Hello ' +
          user.fname +
          ' ' +
          user.lname +
          ', <br><br> Please Click on the link to verify your email.<br><a href=' +
          link +
          '>Click here to verify</a><br><br>Sincerely,<br>Admin Team.<br>',
      };

      await smtpTransport.sendMail(mailOptions);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

module.exports = router;
