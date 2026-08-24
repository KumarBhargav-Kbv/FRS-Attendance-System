const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty', required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  date: { type: Date, required: true },
  time: { type: String },
  status: { type: String, enum: ['PRESENT', 'ABSENT', 'LATE'], default: 'PRESENT' },
  recognitionConfidence: { type: Number, min: 0, max: 100 },
  recognitionMethod: { type: String, enum: ['FACE_RECOGNITION', 'MANUAL'], default: 'FACE_RECOGNITION' },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'AttendanceSession' }
}, { timestamps: true });

// Prevent duplicate attendance: one student per subject per session
attendanceSchema.index({ studentId: 1, subjectId: 1, sessionId: 1 }, { unique: true });
attendanceSchema.index({ date: 1, subjectId: 1 });
attendanceSchema.index({ studentId: 1, date: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
