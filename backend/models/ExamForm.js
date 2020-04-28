const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ExamFormSchema = new mongoose.Schema({
  student: {
    type: Schema.Types.ObjectId,
    ref: 'student',
  },
  professor: {
    type: Schema.Types.ObjectId,
    ref: 'professor',
  },
  applicationNumber: {
    type: Number,
    required: true,
  },
  currentYearOfStudy: {
    type: Number,
    required: true,
  },
  currentSemestar: {
    type: Number,
    required: true,
  },
  currentAcademicYear: {
    type: String,
    required: true,
  },
  subjectName: {
    type: String,
    required: true,
  },
  firstTimeListenedYear: {
    type: String,
    required: true,
  },
  firstTimeListenedSemester: {
    type: Number,
    required: true,
  },
  professorExaminer: {
    type: String,
    required: true,
  },
  grade: {
    type: Number,
  },
  dateOfExam: {
    type: String,
  },
});

module.exports = ExamForm = mongoose.model('examform', ExamFormSchema);
