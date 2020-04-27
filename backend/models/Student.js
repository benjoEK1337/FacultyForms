const moongose = require('mongoose');

const StudentSchema = new moongose.Schema({
  fname: {
    type: String,
    required: true,
  },
  lname: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  faculty: {
    type: String,
    default: 'Faculty Of Electrical Engineering Tuzla',
  },
  fieldOfStudy: {
    type: String,
  },
  indexNumber: {
    type: String,
  },
  role: {
    type: String,
    required: true,
  },
  numberOfExamForms: {
    type: Number,
    default: 0,
    min: 0,
    max: 39,
  },
  numberOfActiveExamForms: {
    type: Number,
    default: 0,
    min: 0,
    max: 6,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  hash: {
    type: String,
    default: '',
  },
});

module.exports = Student = moongose.model('student', StudentSchema);
