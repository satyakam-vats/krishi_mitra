const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false,
  },
  phone: {
    type: String,
    trim: true,
    match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number'],
  },
  location: {
    latitude: Number,
    longitude: Number,
    address: String,
  },
  farmDetails: {
    size: {
      type: Number,
      min: [0, 'Farm size cannot be negative'],
    },
    crops: [{
      type: String,
      trim: true,
    }],
    soilType: {
      type: String,
      enum: ['sandy', 'loamy', 'clay', 'silt', 'peaty', 'chalky'],
    },
  },
  preferences: {
    language: {
      type: String,
      default: 'en',
      enum: ['en', 'hi', 'kn', 'ta', 'te'],
    },
    notifications: {
      weather: { type: Boolean, default: true },
      market: { type: Boolean, default: true },
      disease: { type: Boolean, default: true },
    },
    units: {
      temperature: { type: String, default: 'celsius', enum: ['celsius', 'fahrenheit'] },
      area: { type: String, default: 'acres', enum: ['acres', 'hectares'] },
    },
  },
  subscription: {
    type: {
      type: String,
      default: 'free',
      enum: ['free', 'premium', 'enterprise'],
    },
    expiresAt: Date,
    features: [String],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: Date,
  loginCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});


userSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });


userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});


userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};


userSchema.methods.updateLoginInfo = function() {
  this.lastLogin = new Date();
  this.loginCount += 1;
  return this.save();
};


userSchema.methods.getPublicProfile = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};


userSchema.statics.findNearby = function(latitude, longitude, maxDistance = 50) {
  return this.find({
    'location.latitude': {
      $gte: latitude - (maxDistance / 111), 
      $lte: latitude + (maxDistance / 111),
    },
    'location.longitude': {
      $gte: longitude - (maxDistance / 111),
      $lte: longitude + (maxDistance / 111),
    },
    isActive: true,
  });
};

module.exports = mongoose.model('User', userSchema);
