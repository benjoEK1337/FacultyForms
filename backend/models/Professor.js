const mongoose = require('mongoose');

const ProfessorSchema = new mongoose.Schema({
  fname: {
    type: String,
    required: true,
  },
  lname: {
    type: String,
    required: true,
  },
  academicRank: {
    type: String,
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
  subjects: {
    type: [String],
  },
  role: {
    type: String,
    required: true,
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

module.exports = Professor = mongoose.model('professor', ProfessorSchema);
