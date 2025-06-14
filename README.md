# 🦐 Shrimp Contract Management System

A complete contract management system for shrimp trading businesses.

## 🎯 Features

- **Role-based Authentication** (General Manager, Supplier, Administrator)
- **Dynamic Pricing System** (handles any shrimp sizes using PostgreSQL JSONB)
- **Real-time Contract Collaboration**
- **WhatsApp Integration** (coming soon)
- **Excel Import/Export** (coming soon)
- **Complete Audit Trail**

## 🏗️ Architecture

- **Backend**: Node.js + Express + PostgreSQL
- **Frontend**: React + TypeScript + Tailwind CSS (coming soon)
- **Database**: PostgreSQL with JSONB for dynamic pricing
- **Authentication**: JWT tokens with bcrypt password hashing

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- PostgreSQL 15+
- npm or yarn

### Backend Setup

1. **Clone the repository**
   git clone <your-repo-url>
   cd ContractManagement_BMS/backend
   
2. **Istall dependencies**
   npm install

3. **Set up environment variables**
   cp .env.example .env
   # Edit .env with your database credentials

4. **Set up database**
   createdb shrimp_contracts
   psql -d shrimp_contracts -f src/config/schema.sql
   
5. **Start the server**
   npm run dev

📡 API Endpoints
Authentication

POST /api/auth/register - Create new user
POST /api/auth/login - User login

System

GET /api/health - Health check with database status
GET /api/test - Simple API test

👥 User Roles

General Manager: Creates contracts, sets pricing, manages system
Supplier: Fills delivery details, responds to contracts
Administrator: Manages database, exports data, system administration

🛡️ Security Features

Password hashing with bcryptjs
JWT token authentication
Input validation and sanitization
SQL injection prevention
Role-based access control

📊 Database Schema

users: User accounts with role-based access
contracts: Contract data with JSONB for dynamic pricing
audit_logs: Complete activity tracking

🧪 Testing
Test the API using Postman or curl:
bash# Health check
curl http://localhost:3001/api/health

# Register user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"gm@test.com","name":"General Manager","password":"password123","role":"general_manager"}'

📈 Development Status

✅ Backend API with authentication
✅ PostgreSQL database with dynamic pricing
✅ Role-based access control
✅ Comprehensive testing
🔄 React frontend (in progress)
🔄 Contract management features (in progress)
🔄 WhatsApp integration (planned)
