# AgriAdvisor - AI-Powered Agricultural Advisory PWA

A comprehensive Progressive Web Application (PWA) designed to empower smallholder farmers with AI-driven agricultural insights, weather-based irrigation recommendations, and real-time market intelligence.

## 🌱 Features

### Core Functionality
- **AI-Powered Crop Disease Detection**: Upload or capture crop images for instant disease diagnosis
- **Smart Irrigation Advisor**: Weather-based irrigation recommendations with water conservation tips
- **Market Intelligence**: Real-time crop prices, trends, and buyer connections
- **Offline-First Design**: Full functionality without internet connection
- **Multi-language Support**: Accessible in multiple regional languages

### Technical Highlights
- **Progressive Web App (PWA)**: Installable, fast, and reliable
- **Offline Capabilities**: IndexedDB storage with automatic sync
- **AI/ML Integration**: TensorFlow.js for client-side inference
- **Responsive Design**: Optimized for mobile and desktop
- **Glassmorphic UI**: Modern, farmer-friendly interface

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- MongoDB 5+
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd agri-advisor
```

2. **Install frontend dependencies**
```bash
npm install
```

3. **Install backend dependencies**
```bash
cd backend
npm install
cd ..
```

4. **Environment Setup**
```bash
# Copy environment files
cp backend/.env.example backend/.env

# Update backend/.env with your configuration:
# - MongoDB connection string
# - JWT secret
# - API keys for weather/market services
```

5. **Start the application**
```bash
# Start backend server (from backend directory)
cd backend
npm run dev

# Start frontend (from root directory)
cd ..
npm start
```

The application will be available at `http://localhost:3000`

## 📱 Usage

### For Farmers
1. **Register/Login**: Create an account with farm details
2. **Crop Diagnosis**: 
   - Take photos of crops using camera
   - Get instant AI-powered disease detection
   - Receive treatment recommendations
3. **Irrigation Planning**:
   - Get weather-based watering advice
   - Optimize water usage
   - Set irrigation reminders
4. **Market Intelligence**:
   - Check current crop prices
   - Find potential buyers
   - Set price alerts

### Offline Mode
- All core features work without internet
- Data syncs automatically when connection is restored
- Cached AI models for basic disease detection

## 🏗️ Architecture

### Frontend Stack
- **React 18** with TypeScript
- **Material-UI** for components
- **TensorFlow.js** for AI inference
- **IndexedDB** for offline storage
- **Service Workers** for PWA functionality

### Backend Stack
- **Node.js** with Express
- **MongoDB** with Mongoose
- **JWT** authentication
- **Multer** for file uploads
- **Sharp** for image processing

### AI/ML Pipeline
- **TensorFlow.js** for client-side inference
- **CNN models** for disease detection
- **Image preprocessing** with Sharp
- **Hybrid online/offline** analysis

## 🔧 Configuration

### Environment Variables

**Backend (.env)**
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/agri-advisor
JWT_SECRET=your-secret-key
OPENWEATHER_API_KEY=your-api-key
```

**Frontend**
Configuration is handled through environment variables and can be set in `.env.local`

### API Keys Required
- **OpenWeather API**: For weather data
- **Google Maps API**: For location services (optional)
- **Agricultural Market APIs**: For real-time pricing (optional)

## 📊 API Documentation

### Authentication
```bash
POST /api/auth/register - Register new user
POST /api/auth/login - User login
GET /api/auth/validate - Validate JWT token
```

### Crop Analysis
```bash
POST /api/crops/diagnose - Analyze crop image
GET /api/crops/history - Get diagnosis history
GET /api/crops/statistics - Get crop statistics
```

### Weather & Irrigation
```bash
GET /api/weather/current - Current weather
GET /api/weather/forecast - Weather forecast
POST /api/weather/irrigation-advice - Get irrigation recommendations
```

### Market Data
```bash
GET /api/market/prices - Current market prices
GET /api/market/trends - Market trends
GET /api/market/buyers - Buyer directory
```

## 🔄 Offline Functionality

### Service Worker Features
- **Caching Strategy**: Cache-first for static assets, network-first for API calls
- **Background Sync**: Queue offline actions for later sync
- **Push Notifications**: Weather alerts and price notifications

### Data Synchronization
- **IndexedDB Storage**: Local data persistence
- **Conflict Resolution**: Timestamp-based merging
- **Incremental Sync**: Only sync changed data

## 🎨 UI/UX Features

### Farmer-Centric Design
- **Large Touch Targets**: Minimum 44px for mobile accessibility
- **Visual-First Interface**: Icons and images over text
- **High Contrast**: Easy reading in outdoor conditions
- **Glassmorphic Effects**: Modern, professional appearance

### Accessibility
- **Multi-language Support**: Hindi, Kannada, Tamil, Telugu
- **Voice Commands**: For low-literacy users
- **Offline Indicators**: Clear connection status
- **Progressive Enhancement**: Works on all devices

## 🚀 Deployment

### Frontend (Vercel)
```bash
# Build for production
npm run build

# Deploy to Vercel
vercel --prod
```

### Backend (Heroku)
```bash
# From backend directory
git init
heroku create agri-advisor-api
git add .
git commit -m "Initial deployment"
git push heroku main
```

### Environment Setup
- Set production environment variables
- Configure MongoDB Atlas for database
- Set up CDN for image storage
- Configure domain and SSL

## 📈 Performance Optimization

### Frontend
- **Code Splitting**: Lazy loading of routes
- **Image Optimization**: Sharp for processing
- **Bundle Analysis**: Webpack bundle analyzer
- **Caching**: Aggressive caching strategy

### Backend
- **Database Indexing**: Optimized queries
- **Image Compression**: Automatic resizing
- **Rate Limiting**: API protection
- **Monitoring**: Error tracking and analytics

## 🧪 Testing

### Frontend Testing
```bash
npm test                 # Run unit tests
npm run test:coverage   # Coverage report
npm run test:e2e        # End-to-end tests
```

### Backend Testing
```bash
cd backend
npm test                # Run API tests
npm run test:integration # Integration tests
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation
- Follow semantic versioning

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- [User Guide](docs/user-guide.md)
- [API Reference](docs/api-reference.md)
- [Deployment Guide](docs/deployment.md)

### Contact
- **Email**: support@agriadvisor.com
- **Phone**: +91 123 456 7890
- **WhatsApp**: +91 123 456 7890

### Community
- [GitHub Issues](https://github.com/agriadvisor/issues)
- [Discord Community](https://discord.gg/agriadvisor)
- [Telegram Group](https://t.me/agriadvisor)

## 🙏 Acknowledgments

- Farmers who provided feedback and testing
- Open source community for tools and libraries
- Agricultural experts for domain knowledge
- Government APIs for market data access

---

**Built with ❤️ for farmers worldwide**

*Empowering smallholder farmers through technology and AI*
