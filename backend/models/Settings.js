const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  description: { type: String }
}, { timestamps: true });

// Default settings
settingsSchema.statics.getDefaults = function() {
  return {
    attendanceThreshold: 75,
    recognitionConfidenceThreshold: 60,
    maxSessionDuration: 120, // minutes
    allowLateAttendance: true,
    lateThresholdMinutes: 15,
    instituteName: 'FRS College of Technology',
    instituteCode: 'FRSCT'
  };
};

settingsSchema.statics.getSetting = async function(key) {
  const setting = await this.findOne({ key });
  if (setting) return setting.value;
  const defaults = this.getDefaults();
  return defaults[key] || null;
};

module.exports = mongoose.model('Settings', settingsSchema);
