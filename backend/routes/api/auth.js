const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const auth = require('../../middleware/auth');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');

const Student = require('../../models/Student');
const Professor = require('../../models/Professor');
const Admin = require('../../models/Admin');

// @route   GET api/auth
// @desc    Load user
// @access  Public
router.get('/', auth, async (req, res) => {
  const COLLECTION_NAME = req.user.role === 'Student' ? Student : Professor;
  try {
    const user = await COLLECTION_NAME.findById(req.user.id).select(
      '-password'
    );
    res.json(user);
  } catch (err) {
    console.log(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth
// @desc    Login user & get token
// @access  Public
router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ errors: errors.array({ onlyFirstError: true }) });
    }

    const { email, password } = req.body;

    try {
      // If Student exists program don't search in base for professor & admin.
      const userProfessor, userAdmin;
      const userStudent = await Student.findOne({ email });

      if(!userStudent) userProfessor = await Professor.findOne({ email });
      else if(!userStudent && !userProfessor) userAdmin = await Admin.findOne({ email });

      if (!userStudent && !userProfessor && !userAdmin) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Invalid Credentials' }] });
      }

      const user;
      if(userAdmin) user = userAdmin;
      else user = !userProfessor ? userStudent : userProfessor;

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Invalid Credentials' }] });
      }

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
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

module.exports = router;
