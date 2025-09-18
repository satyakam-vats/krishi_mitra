const express = require('express');
const { body, validationResult } = require('express-validator');
const CropDiagnosis = require('../models/CropDiagnosis');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/sync
// @desc    Sync offline data to server
// @access  Private
router.post('/', auth, [
  body('type').isIn(['diagnosis', 'irrigation', 'market', 'user_data']).withMessage('Invalid sync type'),
  body('data').exists().withMessage('Data is required'),
  body('timestamp').isISO8601().withMessage('Valid timestamp is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        details: errors.array(),
      });
    }

    const { type, data, timestamp } = req.body;
    const userId = req.user.userId;

    let syncResult = {};

    switch (type) {
      case 'diagnosis':
        syncResult = await syncDiagnosisData(userId, data, timestamp);
        break;
      case 'irrigation':
        syncResult = await syncIrrigationData(userId, data, timestamp);
        break;
      case 'market':
        syncResult = await syncMarketData(userId, data, timestamp);
        break;
      case 'user_data':
        syncResult = await syncUserData(userId, data, timestamp);
        break;
      default:
        return res.status(400).json({
          error: 'Invalid Sync Type',
          message: 'Unsupported sync type',
        });
    }

    res.json({
      message: 'Data synced successfully',
      type,
      result: syncResult,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({
      error: 'Sync Failed',
      message: 'Unable to sync data',
    });
  }
});

// @route   GET /api/sync/status
// @desc    Get sync status for user
// @access  Private
router.get('/status', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { since } = req.query;

    const sinceDate = since ? new Date(since) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Get counts of data created since last sync
    const diagnosisCount = await CropDiagnosis.countDocuments({
      user: userId,
      createdAt: { $gte: sinceDate },
    });

    const user = await User.findById(userId);
    const lastSync = user?.lastSync || null;

    const status = {
      lastSync,
      pendingItems: {
        diagnoses: diagnosisCount,
        // Add other data types as needed
      },
      serverTime: new Date().toISOString(),
    };

    res.json({
      message: 'Sync status retrieved successfully',
      status,
    });
  } catch (error) {
    console.error('Sync status error:', error);
    res.status(500).json({
      error: 'Status Failed',
      message: 'Unable to get sync status',
    });
  }
});

// @route   POST /api/sync/batch
// @desc    Sync multiple items in batch
// @access  Private
router.post('/batch', auth, [
  body('items').isArray().withMessage('Items must be an array'),
  body('items.*.type').isIn(['diagnosis', 'irrigation', 'market', 'user_data']),
  body('items.*.data').exists(),
  body('items.*.timestamp').isISO8601(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        details: errors.array(),
      });
    }

    const { items } = req.body;
    const userId = req.user.userId;
    const results = [];

    // Process each item
    for (const item of items) {
      try {
        let syncResult = {};

        switch (item.type) {
          case 'diagnosis':
            syncResult = await syncDiagnosisData(userId, item.data, item.timestamp);
            break;
          case 'irrigation':
            syncResult = await syncIrrigationData(userId, item.data, item.timestamp);
            break;
          case 'market':
            syncResult = await syncMarketData(userId, item.data, item.timestamp);
            break;
          case 'user_data':
            syncResult = await syncUserData(userId, item.data, item.timestamp);
            break;
        }

        results.push({
          type: item.type,
          status: 'success',
          result: syncResult,
        });
      } catch (itemError) {
        console.error(`Sync error for item ${item.type}:`, itemError);
        results.push({
          type: item.type,
          status: 'error',
          error: itemError.message,
        });
      }
    }

    // Update user's last sync time
    await User.findByIdAndUpdate(userId, {
      lastSync: new Date(),
    });

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    res.json({
      message: 'Batch sync completed',
      summary: {
        total: items.length,
        success: successCount,
        errors: errorCount,
      },
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Batch sync error:', error);
    res.status(500).json({
      error: 'Batch Sync Failed',
      message: 'Unable to sync batch data',
    });
  }
});

// Helper function to sync diagnosis data
const syncDiagnosisData = async (userId, data, timestamp) => {
  // Check if diagnosis already exists (prevent duplicates)
  const existingDiagnosis = await CropDiagnosis.findOne({
    user: userId,
    createdAt: new Date(timestamp),
    'diagnosis.disease': data.result?.disease,
  });

  if (existingDiagnosis) {
    return {
      action: 'skipped',
      reason: 'Diagnosis already exists',
      id: existingDiagnosis._id,
    };
  }

  // Create new diagnosis record
  const diagnosis = new CropDiagnosis({
    user: userId,
    diagnosis: data.result,
    crop: data.crop || 'unknown',
    location: data.location,
    weather: data.weather,
    isOffline: true,
    createdAt: new Date(timestamp),
  });

  await diagnosis.save();

  return {
    action: 'created',
    id: diagnosis._id,
  };
};

// Helper function to sync irrigation data
const syncIrrigationData = async (userId, data, timestamp) => {
  // For irrigation data, we might just log it or update user preferences
  // This is typically analytics data rather than persistent records
  
  return {
    action: 'logged',
    timestamp: new Date(timestamp),
    data: {
      crop: data.crop,
      recommendation: data.recommendation,
      weather: data.weather,
    },
  };
};

// Helper function to sync market data
const syncMarketData = async (userId, data, timestamp) => {
  // Market data sync might involve updating user's market interests
  // or logging market queries for analytics
  
  return {
    action: 'logged',
    timestamp: new Date(timestamp),
    data: {
      queries: data.queries || [],
      interactions: data.interactions || [],
    },
  };
};

// Helper function to sync user data
const syncUserData = async (userId, data, timestamp) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Update user preferences or profile data
  const allowedUpdates = ['preferences', 'farmDetails', 'location'];
  const updates = {};

  allowedUpdates.forEach(field => {
    if (data[field] !== undefined) {
      updates[field] = data[field];
    }
  });

  if (Object.keys(updates).length > 0) {
    Object.assign(user, updates);
    await user.save();

    return {
      action: 'updated',
      fields: Object.keys(updates),
    };
  }

  return {
    action: 'no_changes',
    reason: 'No valid updates found',
  };
};

// @route   DELETE /api/sync/clear
// @desc    Clear old synced data
// @access  Private
router.delete('/clear', auth, async (req, res) => {
  try {
    const { olderThan = '30d' } = req.query;
    const userId = req.user.userId;

    let cutoffDate;
    switch (olderThan) {
      case '7d':
        cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    // Delete old diagnosis records (keep recent ones)
    const deleteResult = await CropDiagnosis.deleteMany({
      user: userId,
      createdAt: { $lt: cutoffDate },
      isOffline: true, // Only delete offline-generated records
    });

    res.json({
      message: 'Old data cleared successfully',
      deletedCount: deleteResult.deletedCount,
      cutoffDate: cutoffDate.toISOString(),
    });
  } catch (error) {
    console.error('Clear data error:', error);
    res.status(500).json({
      error: 'Clear Failed',
      message: 'Unable to clear old data',
    });
  }
});

module.exports = router;
