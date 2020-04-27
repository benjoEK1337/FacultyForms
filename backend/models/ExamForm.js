const mongoose = required('mongoose');

// Create Schema

const ExamForm = new mongoose.Schema({
  student: {
    type: Schema.Types.ObjectId,
    ref: 'student',
  },
  professor: {
    type: Schema.Types.ObjectId,
    ref: 'professor',
  },
  currentSemestar: {
    type: Boolean,
    default: true,
  },
  currentAcademicYear: {
    type: Boolean,
    default: true,
  },
  applicationNumber: {
    type: Number,
    required: true,
  },
  yearOfStudy: {
    type: Number,
    required: true,
  },
  semester: {
    type: Number,
    required: true,
  },
  academicYear: {
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
    type: String,
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
    type: Date,
  },
});
