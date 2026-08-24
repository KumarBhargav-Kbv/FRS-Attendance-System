const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  subjectCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
  subjectName: { type: String, required: true, trim: true },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  year: { type: Number, required: true, min: 1, max: 4 },
  semester: { type: Number, required: true, min: 1, max: 8 },
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' }
}, { timestamps: true });

module.exports = mongoose.model('Subject', subjectSchema);
