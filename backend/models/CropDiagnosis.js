const mongoose = require('mongoose');

const cropDiagnosisSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  image: {
    originalName: String,
    filename: String,
    path: String,
    size: Number,
    mimetype: String,
  },
  diagnosis: {
    disease: {
      type: String,
      required: true,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      required: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true,
    },
    description: String,
    symptoms: [String],
    treatments: [String],
    prevention: [String],
    organicTreatments: [String],
  },
  crop: {
    type: String,
    required: true,
  },
  location: {
    latitude: Number,
    longitude: Number,
    address: String,
  },
  weather: {
    temperature: Number,
    humidity: Number,
    rainfall: Number,
  },
  isOffline: {
    type: Boolean,
    default: false,
  },
  processingTime: Number, 
  modelVersion: String,
  feedback: {
    isAccurate: Boolean,
    actualDisease: String,
    comments: String,
    submittedAt: Date,
  },
}, {
  timestamps: true,
});


cropDiagnosisSchema.index({ user: 1, createdAt: -1 });
cropDiagnosisSchema.index({ 'diagnosis.disease': 1 });
cropDiagnosisSchema.index({ crop: 1 });
cropDiagnosisSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });


cropDiagnosisSchema.methods.addFeedback = function(feedback) {
  this.feedback = {
    ...feedback,
    submittedAt: new Date(),
  };
  return this.save();
};


cropDiagnosisSchema.statics.getDiseaseStats = function(filters = {}) {
  const pipeline = [
    { $match: filters },
    {
      $group: {
        _id: '$diagnosis.disease',
        count: { $sum: 1 },
        avgConfidence: { $avg: '$diagnosis.confidence' },
        crops: { $addToSet: '$crop' },
      },
    },
    { $sort: { count: -1 } },
  ];
  
  return this.aggregate(pipeline);
};


cropDiagnosisSchema.statics.getUserHistory = function(userId, limit = 10) {
  return this.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('user', 'name email');
};

module.exports = mongoose.model('CropDiagnosis', cropDiagnosisSchema);
