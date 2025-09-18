#!/bin/bash

# AgriAdvisor Deployment Script
# This script automates the deployment process for both frontend and backend

set -e  # Exit on any error

echo "🌱 Starting AgriAdvisor Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 16+ and try again."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm and try again."
        exit 1
    fi
    
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed. Please install Git and try again."
        exit 1
    fi
    
    print_status "All dependencies are installed ✓"
}

# Install dependencies
install_dependencies() {
    print_status "Installing frontend dependencies..."
    npm install
    
    print_status "Installing backend dependencies..."
    cd backend
    npm install
    cd ..
    
    print_status "Dependencies installed ✓"
}

# Build frontend
build_frontend() {
    print_status "Building frontend for production..."
    npm run build
    print_status "Frontend build completed ✓"
}

# Test backend
test_backend() {
    print_status "Running backend tests..."
    cd backend
    if [ -f "package.json" ] && npm run test --if-present; then
        print_status "Backend tests passed ✓"
    else
        print_warning "No backend tests found or tests failed"
    fi
    cd ..
}

# Deploy to Vercel (Frontend)
deploy_frontend() {
    print_status "Deploying frontend to Vercel..."
    
    if ! command -v vercel &> /dev/null; then
        print_warning "Vercel CLI not found. Installing..."
        npm install -g vercel
    fi
    
    # Deploy to Vercel
    vercel --prod --confirm
    print_status "Frontend deployed to Vercel ✓"
}

# Deploy to Heroku (Backend)
deploy_backend() {
    print_status "Deploying backend to Heroku..."
    
    if ! command -v heroku &> /dev/null; then
        print_error "Heroku CLI not found. Please install Heroku CLI and try again."
        exit 1
    fi
    
    cd backend
    
    # Initialize git if not already done
    if [ ! -d ".git" ]; then
        git init
        git add .
        git commit -m "Initial commit for deployment"
    fi
    
    # Create Heroku app if it doesn't exist
    if ! heroku apps:info agri-advisor-api &> /dev/null; then
        print_status "Creating new Heroku app..."
        heroku create agri-advisor-api
    fi
    
    # Set environment variables
    print_status "Setting environment variables..."
    heroku config:set NODE_ENV=production
    heroku config:set JWT_SECRET=$(openssl rand -base64 32)
    
    # Add MongoDB Atlas addon or set MONGODB_URI
    if [ -z "$MONGODB_URI" ]; then
        print_warning "MONGODB_URI not set. Please set it manually in Heroku dashboard."
    else
        heroku config:set MONGODB_URI="$MONGODB_URI"
    fi
    
    # Deploy to Heroku
    git push heroku main
    
    cd ..
    print_status "Backend deployed to Heroku ✓"
}

# Docker deployment
deploy_docker() {
    print_status "Deploying with Docker..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker and try again."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose and try again."
        exit 1
    fi
    
    # Build and start containers
    docker-compose up --build -d
    
    print_status "Application deployed with Docker ✓"
    print_status "Frontend: http://localhost:3000"
    print_status "Backend: http://localhost:5000"
    print_status "MongoDB: mongodb://localhost:27017"
}

# Main deployment function
main() {
    echo "🌱 AgriAdvisor Deployment Script"
    echo "================================"
    
    # Parse command line arguments
    DEPLOY_TYPE=${1:-"help"}
    
    case $DEPLOY_TYPE in
        "frontend")
            check_dependencies
            install_dependencies
            build_frontend
            deploy_frontend
            ;;
        "backend")
            check_dependencies
            install_dependencies
            test_backend
            deploy_backend
            ;;
        "full")
            check_dependencies
            install_dependencies
            build_frontend
            test_backend
            deploy_frontend
            deploy_backend
            ;;
        "docker")
            deploy_docker
            ;;
        "local")
            check_dependencies
            install_dependencies
            print_status "Starting local development servers..."
            
            # Start backend in background
            cd backend
            npm run dev &
            BACKEND_PID=$!
            cd ..
            
            # Start frontend
            npm start &
            FRONTEND_PID=$!
            
            print_status "Local servers started:"
            print_status "Frontend: http://localhost:3000"
            print_status "Backend: http://localhost:5000"
            print_status "Press Ctrl+C to stop servers"
            
            # Wait for interrupt
            trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
            wait
            ;;
        "help"|*)
            echo "Usage: $0 [OPTION]"
            echo ""
            echo "Options:"
            echo "  frontend    Deploy only frontend to Vercel"
            echo "  backend     Deploy only backend to Heroku"
            echo "  full        Deploy both frontend and backend"
            echo "  docker      Deploy using Docker Compose"
            echo "  local       Start local development servers"
            echo "  help        Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 frontend     # Deploy to Vercel"
            echo "  $0 backend      # Deploy to Heroku"
            echo "  $0 full         # Deploy everything"
            echo "  $0 docker       # Use Docker"
            echo "  $0 local        # Local development"
            ;;
    esac
}

# Run main function with all arguments
main "$@"
