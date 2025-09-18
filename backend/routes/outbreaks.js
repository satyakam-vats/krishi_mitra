const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const DiseaseOutbreak = require('../models/DiseaseOutbreak');
const User = require('../models/User');

const router = express.Router();

// @route   GET /api/outbreaks
// @desc    Get disease outbreaks with filtering
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { 
      region, 
      disease, 
      crop, 
      severity, 
      status = 'active', 
      lat, 
      lon, 
      radius = 50,
      limit = 50 
    } = req.query;

    let query = {};
    
    // Filter by status
    if (status !== 'all') {
      query.status = status;
    }
    
    // Filter by region
    if (region) {
      query['location.region'] = new RegExp(region, 'i');
    }
    
    // Filter by disease
    if (disease) {
      query.disease = new RegExp(disease, 'i');
    }
    
    // Filter by crop
    if (crop) {
      query.crop = new RegExp(crop, 'i');
    }
    
    // Filter by severity
    if (severity) {
      query.severity = severity;
    }
    
    let outbreaks;
    
    // If coordinates provided, find nearby outbreaks
    if (lat && lon) {
      outbreaks = await DiseaseOutbreak.findNearby(
        parseFloat(lat), 
        parseFloat(lon), 
        parseInt(radius)
      );
      
      // Apply additional filters to nearby results
      if (Object.keys(query).length > 0) {
        outbreaks = outbreaks.filter(outbreak => {
          return Object.entries(query).every(([key, value]) => {
            if (key.includes('.')) {
              const [parent, child] = key.split('.');
              return outbreak[parent] && outbreak[parent][child] && 
                     outbreak[parent][child].toString().match(new RegExp(value, 'i'));
            }
            return outbreak[key] && outbreak[key].toString().match(new RegExp(value, 'i'));
          });
        });
      }
    } else {
      outbreaks = await DiseaseOutbreak.find(query)
        .populate('reportedBy.userId', 'name location')
        .sort({ lastUpdated: -1 })
        .limit(parseInt(limit));
    }

    res.json({
      message: 'Outbreaks retrieved successfully',
      data: outbreaks,
      count: outbreaks.length,
      filters: { region, disease, crop, severity, status },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Outbreaks fetch error:', error);
    res.status(500).json({
      error: 'Outbreaks Fetch Failed',
      message: 'Unable to fetch disease outbreaks',
    });
  }
});

// @route   GET /api/outbreaks/regional-stats
// @desc    Get regional outbreak statistics
// @access  Private
router.get('/regional-stats', auth, async (req, res) => {
  try {
    const { region } = req.query;
    
    let stats;
    
    if (region) {
      stats = await DiseaseOutbreak.getRegionalStats(region);
    } else {
      // Get stats for all regions
      const regions = await DiseaseOutbreak.distinct('location.region');
      stats = {};
      
      for (const reg of regions) {
        stats[reg] = await DiseaseOutbreak.getRegionalStats(reg);
      }
    }
    
    // Get overall summary
    const summary = await DiseaseOutbreak.aggregate([
      { $match: { status: { $ne: 'resolved' } } },
      {
        $group: {
          _id: '$location.region',
          totalOutbreaks: { $sum: 1 },
          criticalOutbreaks: {
            $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] }
          },
          affectedFarmers: { $sum: { $size: '$reportedBy' } },
          totalAffectedArea: { $sum: '$affectedArea' },
          diseases: { $addToSet: '$disease' },
        },
      },
      { $sort: { totalOutbreaks: -1 } },
    ]);

    res.json({
      message: 'Regional statistics retrieved successfully',
      data: {
        detailed: stats,
        summary: summary,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Regional stats error:', error);
    res.status(500).json({
      error: 'Stats Fetch Failed',
      message: 'Unable to fetch regional statistics',
    });
  }
});

// @route   POST /api/outbreaks/report
// @desc    Report a new disease outbreak or add to existing
// @access  Private
router.post('/report', auth, [
  body('disease').trim().isLength({ min: 1 }).withMessage('Disease name is required'),
  body('crop').trim().isLength({ min: 1 }).withMessage('Crop name is required'),
  body('location.latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
  body('location.longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
  body('location.address').trim().isLength({ min: 1 }).withMessage('Address is required'),
  body('location.region').trim().isLength({ min: 1 }).withMessage('Region is required'),
  body('severity').isIn(['low', 'medium', 'high', 'critical']).withMessage('Valid severity required'),
  body('affectedArea').optional().isFloat({ min: 0 }).withMessage('Affected area must be positive'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        details: errors.array(),
      });
    }

    const {
      disease,
      crop,
      location,
      severity,
      affectedArea = 0,
      images = [],
      notes = '',
    } = req.body;

    // Check if similar outbreak exists nearby (within 10km)
    const nearbyOutbreaks = await DiseaseOutbreak.find({
      disease: new RegExp(disease, 'i'),
      crop: new RegExp(crop, 'i'),
      'location.latitude': {
        $gte: location.latitude - 0.09, // ~10km
        $lte: location.latitude + 0.09,
      },
      'location.longitude': {
        $gte: location.longitude - 0.09,
        $lte: location.longitude + 0.09,
      },
      status: { $ne: 'resolved' },
    });

    let outbreak;
    let isNewOutbreak = false;

    if (nearbyOutbreaks.length > 0) {
      // Add to existing outbreak
      outbreak = nearbyOutbreaks[0];
      await outbreak.addReport({
        userId: req.user.userId,
        severity,
        affectedArea,
        images,
        notes,
      });
    } else {
      // Create new outbreak
      isNewOutbreak = true;
      outbreak = new DiseaseOutbreak({
        disease,
        crop,
        location,
        severity,
        affectedArea,
        reportedBy: [{
          userId: req.user.userId,
          severity,
          affectedArea,
          images,
          notes,
        }],
      });
      await outbreak.save();
    }

    // Send alerts to nearby farmers if critical
    if (outbreak.severity === 'critical' || outbreak.confirmedCases >= 10) {
      await sendOutbreakAlerts(outbreak);
    }

    res.status(201).json({
      message: isNewOutbreak ? 'New outbreak reported successfully' : 'Report added to existing outbreak',
      data: outbreak,
      isNewOutbreak,
      alertsSent: outbreak.severity === 'critical' || outbreak.confirmedCases >= 10,
    });
  } catch (error) {
    console.error('Outbreak report error:', error);
    res.status(500).json({
      error: 'Report Failed',
      message: 'Unable to report disease outbreak',
    });
  }
});

// @route   PUT /api/outbreaks/:id/status
// @desc    Update outbreak status
// @access  Private
router.put('/:id/status', auth, [
  body('status').isIn(['active', 'contained', 'resolved']).withMessage('Valid status required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        details: errors.array(),
      });
    }

    const { status } = req.body;
    const outbreak = await DiseaseOutbreak.findById(req.params.id);

    if (!outbreak) {
      return res.status(404).json({
        error: 'Outbreak Not Found',
        message: 'Disease outbreak not found',
      });
    }

    await outbreak.updateStatus(status, req.user.userId);

    res.json({
      message: 'Outbreak status updated successfully',
      data: outbreak,
    });
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({
      error: 'Update Failed',
      message: 'Unable to update outbreak status',
    });
  }
});

// @route   POST /api/outbreaks/:id/treatment
// @desc    Add treatment recommendation
// @access  Private
router.post('/:id/treatment', auth, [
  body('treatment').trim().isLength({ min: 1 }).withMessage('Treatment is required'),
  body('dosage').optional().trim(),
  body('frequency').optional().trim(),
  body('duration').optional().trim(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        details: errors.array(),
      });
    }

    const outbreak = await DiseaseOutbreak.findById(req.params.id);

    if (!outbreak) {
      return res.status(404).json({
        error: 'Outbreak Not Found',
        message: 'Disease outbreak not found',
      });
    }

    const treatmentRecommendation = {
      ...req.body,
      recommendedBy: req.user.userId,
    };

    outbreak.treatmentRecommendations.push(treatmentRecommendation);
    outbreak.lastUpdated = new Date();
    await outbreak.save();

    res.status(201).json({
      message: 'Treatment recommendation added successfully',
      data: outbreak,
    });
  } catch (error) {
    console.error('Treatment recommendation error:', error);
    res.status(500).json({
      error: 'Recommendation Failed',
      message: 'Unable to add treatment recommendation',
    });
  }
});

// Helper function to send outbreak alerts
async function sendOutbreakAlerts(outbreak) {
  try {
    // Find farmers within 25km radius
    const nearbyFarmers = await User.findNearby(
      outbreak.location.latitude,
      outbreak.location.longitude,
      25
    );

    // In production, integrate with notification services (SMS, Email, Push)
    const alertMessage = `DISEASE ALERT: ${outbreak.confirmedCases} farmers reported ${outbreak.disease} in ${outbreak.crop} near ${outbreak.location.address}. Check your crops immediately!`;

    // Mock alert sending - in production, use real notification services
    const alert = {
      alertType: 'app',
      recipients: nearbyFarmers.length,
      message: alertMessage,
    };

    outbreak.alertsSent.push(alert);
    await outbreak.save();

    console.log(`Alert sent to ${nearbyFarmers.length} farmers about ${outbreak.disease} outbreak`);
  } catch (error) {
    console.error('Alert sending failed:', error);
  }
}

module.exports = router;
