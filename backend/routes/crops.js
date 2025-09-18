const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { body, validationResult } = require('express-validator');
const CropDiagnosis = require('../models/CropDiagnosis');
const auth = require('../middleware/auth');

const router = express.Router();

// Configure multer for image uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// Disease detection AI service (mock implementation)
const analyzeImage = async (imagePath) => {
  // Simulate AI processing time
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const diseases = [
    {
      disease: 'Healthy Crop',
      confidence: 0.85,
      severity: 'low',
      description: 'Your crop appears to be healthy with no visible signs of disease.',
      symptoms: ['Green, vibrant leaves', 'Normal growth pattern'],
      treatments: ['Continue current care routine'],
      prevention: ['Regular monitoring', 'Proper watering'],
      organicTreatments: ['Maintain organic practices'],
    },
    {
      disease: 'Bacterial Blight',
      confidence: 0.78,
      severity: 'medium',
      description: 'Bacterial infection causing water-soaked lesions.',
      symptoms: ['Water-soaked spots', 'Yellow halos', 'Leaf wilting'],
      treatments: ['Copper-based bactericides', 'Remove infected plants'],
      prevention: ['Avoid overhead watering', 'Crop rotation'],
      organicTreatments: ['Neem oil spray', 'Copper sulfate solution'],
    },
    {
      disease: 'Fungal Leaf Spot',
      confidence: 0.72,
      severity: 'medium',
      description: 'Fungal infection causing circular spots on leaves.',
      symptoms: ['Circular brown spots', 'Yellow margins', 'Leaf drop'],
      treatments: ['Fungicide application', 'Remove affected leaves'],
      prevention: ['Good air circulation', 'Avoid wet foliage'],
      organicTreatments: ['Baking soda spray', 'Milk solution'],
    },
  ];
  
  return diseases[Math.floor(Math.random() * diseases.length)];
};

// @route   POST /api/crops/diagnose
// @desc    Analyze crop image for disease detection
// @access  Private
router.post('/diagnose', auth, upload.single('image'), [
  body('crop').trim().isLength({ min: 1 }).withMessage('Crop type is required'),
  body('location.latitude').optional().isFloat({ min: -90, max: 90 }),
  body('location.longitude').optional().isFloat({ min: -180, max: 180 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        details: errors.array(),
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: 'No Image',
        message: 'Please upload an image',
      });
    }

    const { crop, location, weather } = req.body;
    const startTime = Date.now();

    // Process and optimize image
    const filename = `crop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
    const uploadDir = path.join(__dirname, '../uploads');
    
    // Ensure upload directory exists
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    const imagePath = path.join(uploadDir, filename);
    
    // Optimize image using Sharp
    await sharp(req.file.buffer)
      .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toFile(imagePath);

    // Analyze image with AI model
    const diagnosis = await analyzeImage(imagePath);
    const processingTime = Date.now() - startTime;

    // Save diagnosis to database
    const cropDiagnosis = new CropDiagnosis({
      user: req.user.userId,
      image: {
        originalName: req.file.originalname,
        filename,
        path: imagePath,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
      diagnosis,
      crop,
      location: location ? JSON.parse(location) : undefined,
      weather: weather ? JSON.parse(weather) : undefined,
      processingTime,
      modelVersion: '1.0.0',
    });

    await cropDiagnosis.save();

    res.json({
      message: 'Image analyzed successfully',
      diagnosis,
      processingTime,
      diagnosisId: cropDiagnosis._id,
    });
  } catch (error) {
    console.error('Crop diagnosis error:', error);
    res.status(500).json({
      error: 'Analysis Failed',
      message: 'Unable to analyze crop image',
    });
  }
});

// @route   GET /api/crops/history
// @desc    Get user's diagnosis history
// @access  Private
router.get('/history', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, crop, disease } = req.query;
    const skip = (page - 1) * limit;

    const filter = { user: req.user.userId };
    if (crop) filter.crop = new RegExp(crop, 'i');
    if (disease) filter['diagnosis.disease'] = new RegExp(disease, 'i');

    const diagnoses = await CropDiagnosis.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-image.path'); // Don't expose file paths

    const total = await CropDiagnosis.countDocuments(filter);

    res.json({
      diagnoses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('History fetch error:', error);
    res.status(500).json({
      error: 'Fetch Failed',
      message: 'Unable to fetch diagnosis history',
    });
  }
});

// @route   GET /api/crops/statistics
// @desc    Get crop disease statistics
// @access  Private
router.get('/statistics', auth, async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    
    let dateFilter = {};
    const now = new Date();
    
    switch (timeframe) {
      case '7d':
        dateFilter = { createdAt: { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) } };
        break;
      case '30d':
        dateFilter = { createdAt: { $gte: new Date(now - 30 * 24 * 60 * 60 * 1000) } };
        break;
      case '90d':
        dateFilter = { createdAt: { $gte: new Date(now - 90 * 24 * 60 * 60 * 1000) } };
        break;
    }

    const userFilter = { user: req.user.userId, ...dateFilter };

    // Get disease distribution
    const diseaseStats = await CropDiagnosis.getDiseaseStats(userFilter);
    
    // Get crop distribution
    const cropStats = await CropDiagnosis.aggregate([
      { $match: userFilter },
      {
        $group: {
          _id: '$crop',
          count: { $sum: 1 },
          diseases: { $addToSet: '$diagnosis.disease' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Get severity distribution
    const severityStats = await CropDiagnosis.aggregate([
      { $match: userFilter },
      {
        $group: {
          _id: '$diagnosis.severity',
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      timeframe,
      diseaseStats,
      cropStats,
      severityStats,
    });
  } catch (error) {
    console.error('Statistics fetch error:', error);
    res.status(500).json({
      error: 'Statistics Failed',
      message: 'Unable to fetch statistics',
    });
  }
});

// @route   POST /api/crops/feedback/:id
// @desc    Submit feedback for a diagnosis
// @access  Private
router.post('/feedback/:id', auth, [
  body('isAccurate').isBoolean().withMessage('isAccurate must be a boolean'),
  body('actualDisease').optional().trim(),
  body('comments').optional().trim().isLength({ max: 500 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        details: errors.array(),
      });
    }

    const diagnosis = await CropDiagnosis.findOne({
      _id: req.params.id,
      user: req.user.userId,
    });

    if (!diagnosis) {
      return res.status(404).json({
        error: 'Diagnosis Not Found',
        message: 'Diagnosis not found or access denied',
      });
    }

    await diagnosis.addFeedback(req.body);

    res.json({
      message: 'Feedback submitted successfully',
    });
  } catch (error) {
    console.error('Feedback submission error:', error);
    res.status(500).json({
      error: 'Feedback Failed',
      message: 'Unable to submit feedback',
    });
  }
});

// @route   GET /api/crops/recommendations/:crop
// @desc    Get crop-specific recommendations
// @access  Private
router.get('/recommendations/:crop', auth, async (req, res) => {
  try {
    const { crop } = req.params;
    const { season, location } = req.query;

    // Mock recommendations based on crop type
    const recommendations = {
      tomato: {
        planting: {
          season: 'Spring/Summer',
          soilTemp: '60-70°F',
          spacing: '18-24 inches apart',
        },
        care: [
          'Water deeply but infrequently',
          'Provide support with stakes or cages',
          'Mulch around plants to retain moisture',
          'Prune suckers for better fruit production',
        ],
        commonDiseases: [
          'Early Blight',
          'Late Blight',
          'Bacterial Wilt',
          'Fusarium Wilt',
        ],
        prevention: [
          'Rotate crops annually',
          'Ensure good air circulation',
          'Water at soil level, not on leaves',
          'Remove plant debris',
        ],
      },
      wheat: {
        planting: {
          season: 'Fall/Winter',
          soilTemp: '50-60°F',
          spacing: '6-8 inches between rows',
        },
        care: [
          'Plant in well-drained soil',
          'Apply nitrogen fertilizer in spring',
          'Monitor for pest infestations',
          'Harvest when grain is fully mature',
        ],
        commonDiseases: [
          'Rust',
          'Powdery Mildew',
          'Septoria Leaf Blotch',
          'Fusarium Head Blight',
        ],
        prevention: [
          'Use disease-resistant varieties',
          'Practice crop rotation',
          'Ensure proper field drainage',
          'Apply fungicides when necessary',
        ],
      },
    };

    const cropRecommendations = recommendations[crop.toLowerCase()] || {
      message: 'Recommendations not available for this crop',
    };

    res.json({
      crop,
      recommendations: cropRecommendations,
      season,
      location,
    });
  } catch (error) {
    console.error('Recommendations fetch error:', error);
    res.status(500).json({
      error: 'Recommendations Failed',
      message: 'Unable to fetch recommendations',
    });
  }
});

module.exports = router;
