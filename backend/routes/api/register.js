const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cryptoRandomString = require('crypto-random-string');
const config = require('config');
const { check, validationResult, checkSchema } = require('express-validator');
const smtpTransport = require('../../emails/send_verification');

const Student = require('../../models/Student');
const Professor = require('../../models/Professor');

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

// @route   POST api/register
// @desc    Register user
// @access  Public
router.post(
  '/',
  [
    check('fname', 'First name is required').not().isEmpty(),
    check('lname', 'Last name is required').not().isEmpty(),
    check(
      'email',
      'Please include a valid email. Only fet.ba domain is accepted'
    ).isEmail(),
    check(
      'password',
      'Please enter a password with 6 or more characters'
    ).isLength({ min: 6 }),
    checkSchema(Schema),
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { fname, lname, email, password, role } = req.body;

    const COLLECTION_NAME = role === 'Student' ? Student : Professor;

    try {
      // See if user exists
      let userStudent = await Student.findOne({ email });
      let userProfessor = await Professor.findOne({ email });

      if (userProfessor || userStudent) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'User already exists' }] });
      }

      user = new COLLECTION_NAME({
        fname,
        lname,
        email,
        password,
        role,
      });

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      user.hash = await cryptoRandomString({ length: 128, type: 'url-safe' });

      await user.save();

      const payload = {
        user: {
          id: user.id,
          role: user.role,
        },
      };

      jwt.sign(
        payload,
        config.get('jwtSecret'),
        { expiresIn: 360000 },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );

      const link =
        'http://' + req.get('host') + '/api/register/verify/' + user.hash;
      const mailOptions = {
        to: email,
        subject: 'Please confirm your Email account',
        html:
          'Hello ' +
          fname +
          ' ' +
          lname +
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

// @route   GET api/register/verify/:hash
// @desc    Verify user
// @access  Private
router.get('/verify/:hash', async (req, res) => {
  try {
    const userStudent = await Student.findOne({ hash: req.params.hash });
    const userProfessor = await Professor.findOne({ hash: req.params.hash });
    if (!userStudent && !userProfessor) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    const COLLECTION_NAME = !userProfessor ? Student : Professor;
    const user = !userProfessor ? userStudent : userProfessor;

    user.verified = true;
    await COLLECTION_NAME.updateOne({ _id: user.id }, { $unset: { hash: 1 } });
    await user.save();
    res.json({ msg: 'Email is successfully verified' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
