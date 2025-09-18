// MongoDB initialization script for Docker
db = db.getSiblingDB('agri-advisor');

// Create collections
db.createCollection('users');
db.createCollection('cropdiagnoses');

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "location.coordinates": "2dsphere" });
db.users.createIndex({ "createdAt": 1 });

db.cropdiagnoses.createIndex({ "user": 1 });
db.cropdiagnoses.createIndex({ "createdAt": -1 });
db.cropdiagnoses.createIndex({ "location.coordinates": "2dsphere" });
db.cropdiagnoses.createIndex({ "diagnosis.disease": 1 });

// Insert sample data for development
db.users.insertOne({
  name: "Demo Farmer",
  email: "demo@farmer.com",
  password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uDfS", // password: demo123
  phone: "+91 9876543210",
  farmDetails: {
    size: 5,
    location: "Karnataka, India",
    crops: ["rice", "wheat", "tomato"]
  },
  location: {
    type: "Point",
    coordinates: [77.5946, 12.9716] // Bangalore coordinates
  },
  preferences: {
    language: "en",
    notifications: true,
    offlineMode: true,
    voiceCommands: false
  },
  isActive: true,
  createdAt: new Date()
});

print("Database initialized successfully!");
