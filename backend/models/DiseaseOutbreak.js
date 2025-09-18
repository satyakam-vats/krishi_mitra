const mongoose = require('mongoose');

const diseaseOutbreakSchema = new mongoose.Schema({
  disease: {
    type: String,
    required: [true, 'Disease name is required'],
    trim: true,
  },
  crop: {
    type: String,
    required: [true, 'Crop name is required'],
    trim: true,
  },
  location: {
    latitude: {
      type: Number,
      required: [true, 'Latitude is required'],
      min: -90,
      max: 90,
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required'],
      min: -180,
      max: 180,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    region: {
      type: String,
      required: [true, 'Region is required'],
      trim: true,
    },
    district: String,
    state: String,
    country: {
      type: String,
      default: 'India',
    },
  },
  reportedBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reportedAt: {
      type: Date,
      default: Date.now,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    affectedArea: {
      type: Number, // in acres
      min: 0,
    },
    images: [String], // URLs to uploaded images
    notes: String,
  }],
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['active', 'contained', 'resolved'],
    default: 'active',
  },
  affectedArea: {
    type: Number, // Total affected area in acres
    default: 0,
    min: 0,
  },
  confirmedCases: {
    type: Number,
    default: 1,
    min: 1,
  },
  firstReported: {
    type: Date,
    default: Date.now,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
  treatmentRecommendations: [{
    treatment: String,
    dosage: String,
    frequency: String,
    duration: String,
    notes: String,
    recommendedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    recommendedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  preventionMeasures: [String],
  alertsSent: [{
    alertType: {
      type: String,
      enum: ['sms', 'email', 'push', 'app'],
    },
    recipients: Number,
    sentAt: {
      type: Date,
      default: Date.now,
    },
    message: String,
  }],
  isVerified: {
    type: Boolean,
    default: false,
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  verifiedAt: Date,
}, {
  timestamps: true,
});

// Indexes for efficient querying
diseaseOutbreakSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });
diseaseOutbreakSchema.index({ disease: 1, crop: 1 });
diseaseOutbreakSchema.index({ 'location.region': 1, status: 1 });
diseaseOutbreakSchema.index({ severity: 1, status: 1 });
diseaseOutbreakSchema.index({ createdAt: -1 });

// Virtual for total reporters count
diseaseOutbreakSchema.virtual('reporterCount').get(function() {
  return this.reportedBy.length;
});

// Method to add a new report to existing outbreak
diseaseOutbreakSchema.methods.addReport = function(reportData) {
  this.reportedBy.push(reportData);
  this.confirmedCases = this.reportedBy.length;
  this.affectedArea += reportData.affectedArea || 0;
  this.lastUpdated = new Date();
  
  // Update severity based on number of reports and affected area
  if (this.confirmedCases >= 20 || this.affectedArea >= 500) {
    this.severity = 'critical';
  } else if (this.confirmedCases >= 10 || this.affectedArea >= 200) {
    this.severity = 'high';
  } else if (this.confirmedCases >= 5 || this.affectedArea >= 50) {
    this.severity = 'medium';
  }
  
  return this.save();
};

// Method to update status
diseaseOutbreakSchema.methods.updateStatus = function(newStatus, updatedBy) {
  this.status = newStatus;
  this.lastUpdated = new Date();
  
  if (newStatus === 'resolved') {
    this.resolvedAt = new Date();
    this.resolvedBy = updatedBy;
  }
  
  return this.save();
};

// Static method to find nearby outbreaks
diseaseOutbreakSchema.statics.findNearby = function(latitude, longitude, radiusKm = 50) {
  const radiusDegrees = radiusKm / 111; // Rough conversion km to degrees
  
  return this.find({
    'location.latitude': {
      $gte: latitude - radiusDegrees,
      $lte: latitude + radiusDegrees,
    },
    'location.longitude': {
      $gte: longitude - radiusDegrees,
      $lte: longitude + radiusDegrees,
    },
    status: { $ne: 'resolved' },
  }).populate('reportedBy.userId', 'name location');
};

// Static method to get regional statistics
diseaseOutbreakSchema.statics.getRegionalStats = function(region) {
  return this.aggregate([
    { $match: { 'location.region': region, status: { $ne: 'resolved' } } },
    {
      $group: {
        _id: '$disease',
        count: { $sum: 1 },
        totalAffectedArea: { $sum: '$affectedArea' },
        totalReporters: { $sum: { $size: '$reportedBy' } },
        severities: { $push: '$severity' },
      },
    },
    { $sort: { count: -1 } },
  ]);
};

module.exports = mongoose.model('DiseaseOutbreak', diseaseOutbreakSchema);
