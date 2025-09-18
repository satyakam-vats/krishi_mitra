const express = require('express');
const axios = require('axios');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

const router = express.Router();

// Mock market data for development
const generateMockMarketData = () => {
  const crops = ['Tomato', 'Wheat', 'Rice', 'Corn', 'Potato', 'Onion', 'Cabbage', 'Carrot'];
  const markets = ['Delhi Mandi', 'Mumbai APMC', 'Bangalore Market', 'Chennai Koyambedu', 'Kolkata Market'];
  
  return {
    prices: crops.flatMap(crop => 
      markets.slice(0, Math.floor(Math.random() * 3) + 2).map(market => ({
        crop,
        variety: `${crop} - Grade A`,
        price: 15 + Math.random() * 85,
        unit: 'per kg',
        change: (Math.random() - 0.5) * 15,
        market,
        date: new Date().toISOString().split('T')[0],
        quality: ['A', 'B', 'C'][Math.floor(Math.random() * 3)],
        volume: Math.floor(Math.random() * 1000) + 100,
      }))
    ),
    trends: crops.map(crop => ({
      crop,
      currentPrice: 25 + Math.random() * 75,
      weeklyChange: (Math.random() - 0.5) * 25,
      monthlyChange: (Math.random() - 0.5) * 50,
      seasonalTrend: ['rising', 'falling', 'stable'][Math.floor(Math.random() * 3)],
      bestSellingTime: ['Morning (6-9 AM)', 'Evening (4-7 PM)', 'Early Morning (5-8 AM)'][Math.floor(Math.random() * 3)],
      demandLevel: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)],
    })),
    buyers: [
      {
        id: 'buyer1',
        name: 'Fresh Produce Co.',
        location: 'Delhi',
        crops: ['Tomato', 'Potato', 'Onion', 'Cabbage'],
        phone: '+91 98765 43210',
        email: 'contact@freshproduce.com',
        rating: 4.5,
        minQuantity: 100,
        maxQuantity: 5000,
        priceRange: '₹25-45/kg',
        paymentTerms: 'Net 15 days',
        verified: true,
      },
      {
        id: 'buyer2',
        name: 'Green Valley Traders',
        location: 'Mumbai',
        crops: ['Wheat', 'Rice', 'Corn'],
        phone: '+91 87654 32109',
        email: 'info@greenvalley.com',
        rating: 4.2,
        minQuantity: 500,
        maxQuantity: 10000,
        priceRange: '₹18-35/kg',
        paymentTerms: 'Advance payment',
        verified: true,
      },
      {
        id: 'buyer3',
        name: 'Organic Harvest Ltd.',
        location: 'Bangalore',
        crops: ['Tomato', 'Potato', 'Wheat', 'Carrot'],
        phone: '+91 76543 21098',
        email: 'orders@organicharvest.com',
        rating: 4.8,
        minQuantity: 50,
        maxQuantity: 2000,
        priceRange: '₹30-60/kg',
        paymentTerms: 'Cash on delivery',
        verified: true,
      },
      {
        id: 'buyer4',
        name: 'Metro Wholesale',
        location: 'Chennai',
        crops: ['Rice', 'Onion', 'Cabbage'],
        phone: '+91 65432 10987',
        email: 'procurement@metrowholesale.com',
        rating: 4.0,
        minQuantity: 200,
        maxQuantity: 8000,
        priceRange: '₹20-40/kg',
        paymentTerms: 'Net 30 days',
        verified: false,
      },
    ],
  };
};

// @route   GET /api/market/prices
// @desc    Get current market prices
// @access  Private
router.get('/prices', auth, async (req, res) => {
  try {
    const { crop, market, state, limit = 50 } = req.query;

    let marketData;

    if (process.env.NODE_ENV === 'production' && process.env.AGRI_MARKET_API_KEY) {
      // In production, integrate with government agricultural market APIs
      try {
        // Example: India's eNAM API or similar
        const response = await axios.get('https://api.data.gov.in/resource/market-prices', {
          params: {
            'api-key': process.env.AGRI_MARKET_API_KEY,
            format: 'json',
            limit: parseInt(limit),
          },
          timeout: 5000,
        });

        marketData = response.data.records || [];
      } catch (apiError) {
        console.error('Market API error:', apiError.message);
        // Fallback to mock data
        const mockData = generateMockMarketData();
        marketData = mockData.prices;
      }
    } else {
      // Use mock data for development
      const mockData = generateMockMarketData();
      marketData = mockData.prices;
    }

    // Apply filters
    let filteredData = marketData;
    
    if (crop) {
      filteredData = filteredData.filter(item => 
        item.crop.toLowerCase().includes(crop.toLowerCase())
      );
    }
    
    if (market) {
      filteredData = filteredData.filter(item => 
        item.market.toLowerCase().includes(market.toLowerCase())
      );
    }

    // Sort by price change (highest first)
    filteredData.sort((a, b) => b.change - a.change);

    res.json({
      message: 'Market prices retrieved successfully',
      data: filteredData.slice(0, parseInt(limit)),
      filters: { crop, market, state },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Market prices error:', error);
    res.status(500).json({
      error: 'Market Data Failed',
      message: 'Unable to fetch market prices',
    });
  }
});

// @route   GET /api/market/trends
// @desc    Get market trends and analysis
// @access  Private
router.get('/trends', auth, async (req, res) => {
  try {
    const { crop, timeframe = '30d' } = req.query;

    // Generate trend data (in production, this would come from historical data analysis)
    const mockData = generateMockMarketData();
    let trendData = mockData.trends;

    if (crop) {
      trendData = trendData.filter(item => 
        item.crop.toLowerCase().includes(crop.toLowerCase())
      );
    }

    // Add historical price data simulation
    trendData = trendData.map(trend => ({
      ...trend,
      historicalPrices: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        price: trend.currentPrice + (Math.random() - 0.5) * 20,
      })),
      priceVolatility: Math.random() * 0.3, // 0-30% volatility
    }));

    res.json({
      message: 'Market trends retrieved successfully',
      data: trendData,
      timeframe,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Market trends error:', error);
    res.status(500).json({
      error: 'Trends Fetch Failed',
      message: 'Unable to fetch market trends',
    });
  }
});

// @route   GET /api/market/buyers
// @desc    Get list of potential buyers
// @access  Private
router.get('/buyers', auth, async (req, res) => {
  try {
    const { crop, location, minQuantity, verified } = req.query;

    const mockData = generateMockMarketData();
    let buyers = mockData.buyers;

    // Apply filters
    if (crop) {
      buyers = buyers.filter(buyer => 
        buyer.crops.some(c => c.toLowerCase().includes(crop.toLowerCase()))
      );
    }

    if (location) {
      buyers = buyers.filter(buyer => 
        buyer.location.toLowerCase().includes(location.toLowerCase())
      );
    }

    if (minQuantity) {
      buyers = buyers.filter(buyer => 
        buyer.minQuantity <= parseInt(minQuantity)
      );
    }

    if (verified === 'true') {
      buyers = buyers.filter(buyer => buyer.verified);
    }

    // Sort by rating
    buyers.sort((a, b) => b.rating - a.rating);

    res.json({
      message: 'Buyers list retrieved successfully',
      data: buyers,
      filters: { crop, location, minQuantity, verified },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Buyers fetch error:', error);
    res.status(500).json({
      error: 'Buyers Fetch Failed',
      message: 'Unable to fetch buyers list',
    });
  }
});

// @route   POST /api/market/price-alert
// @desc    Set up price alerts for crops
// @access  Private
router.post('/price-alert', auth, [
  body('crop').trim().isLength({ min: 1 }).withMessage('Crop is required'),
  body('targetPrice').isNumeric().withMessage('Target price must be a number'),
  body('alertType').isIn(['above', 'below']).withMessage('Alert type must be above or below'),
  body('market').optional().trim(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        details: errors.array(),
      });
    }

    const { crop, targetPrice, alertType, market } = req.body;

    // In production, save this to a PriceAlert model
    const alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: req.user.userId,
      crop,
      targetPrice: parseFloat(targetPrice),
      alertType,
      market,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    res.status(201).json({
      message: 'Price alert created successfully',
      alert,
    });
  } catch (error) {
    console.error('Price alert error:', error);
    res.status(500).json({
      error: 'Alert Creation Failed',
      message: 'Unable to create price alert',
    });
  }
});

// @route   GET /api/market/opportunities
// @desc    Get market opportunities and recommendations
// @access  Private
router.get('/opportunities', auth, async (req, res) => {
  try {
    const { userCrops } = req.query;
    const crops = userCrops ? userCrops.split(',') : ['tomato', 'wheat', 'rice'];

    const mockData = generateMockMarketData();
    
    // Generate opportunities based on trends and prices
    const opportunities = crops.map(crop => {
      const trend = mockData.trends.find(t => t.crop.toLowerCase() === crop.toLowerCase());
      const prices = mockData.prices.filter(p => p.crop.toLowerCase() === crop.toLowerCase());
      
      if (!trend || prices.length === 0) return null;

      const avgPrice = prices.reduce((sum, p) => sum + p.price, 0) / prices.length;
      const maxPrice = Math.max(...prices.map(p => p.price));
      const bestMarket = prices.find(p => p.price === maxPrice);

      let recommendation = 'hold';
      let confidence = 'medium';
      
      if (trend.weeklyChange > 10 && trend.seasonalTrend === 'rising') {
        recommendation = 'sell';
        confidence = 'high';
      } else if (trend.weeklyChange < -10) {
        recommendation = 'wait';
        confidence = 'medium';
      }

      return {
        crop: trend.crop,
        recommendation,
        confidence,
        currentPrice: avgPrice,
        bestPrice: maxPrice,
        bestMarket: bestMarket?.market,
        priceChange: trend.weeklyChange,
        demandLevel: trend.demandLevel,
        reasoning: `Based on ${trend.weeklyChange > 0 ? 'positive' : 'negative'} weekly trend (${trend.weeklyChange.toFixed(1)}%) and ${trend.seasonalTrend} seasonal pattern`,
        actions: [
          recommendation === 'sell' ? 'Consider selling at current high prices' : 'Monitor price movements',
          `Best market: ${bestMarket?.market}`,
          trend.demandLevel === 'high' ? 'High demand detected' : 'Standard demand levels',
        ],
      };
    }).filter(Boolean);

    res.json({
      message: 'Market opportunities retrieved successfully',
      opportunities,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Market opportunities error:', error);
    res.status(500).json({
      error: 'Opportunities Fetch Failed',
      message: 'Unable to fetch market opportunities',
    });
  }
});

// @route   POST /api/market/contact-buyer
// @desc    Initiate contact with a buyer
// @access  Private
router.post('/contact-buyer', auth, [
  body('buyerId').trim().isLength({ min: 1 }).withMessage('Buyer ID is required'),
  body('crop').trim().isLength({ min: 1 }).withMessage('Crop is required'),
  body('quantity').isNumeric().withMessage('Quantity must be a number'),
  body('message').optional().trim().isLength({ max: 500 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        details: errors.array(),
      });
    }

    const { buyerId, crop, quantity, message } = req.body;

    // In production, this would create a contact record and possibly send notifications
    const contact = {
      id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      farmerId: req.user.userId,
      buyerId,
      crop,
      quantity: parseInt(quantity),
      message,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    // Mock buyer information
    const mockData = generateMockMarketData();
    const buyer = mockData.buyers.find(b => b.id === buyerId);

    res.status(201).json({
      message: 'Contact request sent successfully',
      contact,
      buyer: buyer ? {
        name: buyer.name,
        phone: buyer.phone,
        email: buyer.email,
      } : null,
      nextSteps: [
        'Buyer will be notified of your interest',
        'You may receive a call or message within 24 hours',
        'Prepare quality certificates if available',
      ],
    });
  } catch (error) {
    console.error('Contact buyer error:', error);
    res.status(500).json({
      error: 'Contact Failed',
      message: 'Unable to contact buyer',
    });
  }
});

// @route   GET /api/market/analytics
// @desc    Get market analytics and insights
// @access  Private
router.get('/analytics', auth, async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;

    // Generate analytics data
    const analytics = {
      priceVolatility: {
        high: ['Tomato', 'Onion'],
        medium: ['Potato', 'Cabbage'],
        low: ['Wheat', 'Rice'],
      },
      seasonalTrends: {
        rising: ['Wheat', 'Corn'],
        falling: ['Tomato', 'Potato'],
        stable: ['Rice', 'Onion'],
      },
      demandSupply: {
        highDemand: ['Tomato', 'Onion', 'Potato'],
        balancedMarket: ['Wheat', 'Rice'],
        oversupply: ['Cabbage', 'Carrot'],
      },
      regionalInsights: [
        {
          region: 'North India',
          topCrops: ['Wheat', 'Rice', 'Potato'],
          avgPriceChange: 5.2,
          marketCondition: 'stable',
        },
        {
          region: 'South India',
          topCrops: ['Rice', 'Tomato', 'Onion'],
          avgPriceChange: -2.1,
          marketCondition: 'declining',
        },
        {
          region: 'West India',
          topCrops: ['Onion', 'Tomato', 'Cabbage'],
          avgPriceChange: 8.7,
          marketCondition: 'rising',
        },
      ],
      recommendations: [
        'Consider diversifying crop portfolio to reduce risk',
        'Monitor weather patterns for seasonal planning',
        'Build relationships with multiple buyers',
        'Invest in post-harvest storage for better timing',
      ],
    };

    res.json({
      message: 'Market analytics retrieved successfully',
      analytics,
      timeframe,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Market analytics error:', error);
    res.status(500).json({
      error: 'Analytics Failed',
      message: 'Unable to fetch market analytics',
    });
  }
});

module.exports = router;
