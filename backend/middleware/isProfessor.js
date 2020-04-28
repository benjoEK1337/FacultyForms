const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = function (req, res, next) {
  const token = req.header('x-auth-token');

  try {
    const decoded = jwt.verify(token, config.get('jwtSecret'));

    if (decoded.user.role !== 'Professor') {
      return res.status(403).json({ msg: 'No permision!' });
    }

    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
