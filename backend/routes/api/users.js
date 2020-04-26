const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult, checkSchema } = require('express-validator');

const User = require('../../models/User');

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

// @route   POST api/users
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
    )
      .isEmail()
      .contains('fet.ba'),

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

    try {
      // See if user exists
      let user = await User.findOne({ email });

      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'User already exists' }] });
      }

      user = new User({
        fname,
        lname,
        email,
        password,
        role,
      });

      const salt = await bcrypt.genSalt(10);

      user.password = await bcrypt.hash(password, salt);

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
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

module.exports = router;
