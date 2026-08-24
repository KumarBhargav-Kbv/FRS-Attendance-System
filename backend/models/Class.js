const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  year: { type: Number, required: true, min: 1, max: 4 },
  section: { type: String, required: true, trim: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty', required: true },
  room: { type: String, trim: true },
  schedule: {
    day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] },
    startTime: { type: String },
    endTime: { type: String },
    period: { type: Number }
  }
}, { timestamps: true });

classSchema.index({ departmentId: 1, year: 1, section: 1 });

module.exports = mongoose.model('Class', classSchema);
