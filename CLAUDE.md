# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Backend (Node.js + Express + PostgreSQL)
- **Start backend development server**: `cd backend && npm run dev` (uses nodemon)
- **Start backend production**: `cd backend && npm start`
- **Install backend dependencies**: `cd backend && npm install`

### Frontend (React + TypeScript + Tailwind)
- **Start frontend development**: `cd frontend && npm start`
- **Build frontend for production**: `cd frontend && npm run build`
- **Run frontend tests**: `cd frontend && npm test`
- **Install frontend dependencies**: `cd frontend && npm install`

### Database Setup
- **Create database**: `createdb shrimp_contracts`
- **Initialize schema**: `psql -d shrimp_contracts -f backend/src/config/schema.sql`
- **Environment setup**: Copy `backend/.env.example` to `backend/.env` and configure database credentials

### API Testing
- **Health check**: `curl http://localhost:3001/api/health`
- **API documentation**: Visit `http://localhost:3001/api-docs` (Swagger UI)
- **Test endpoint**: `curl http://localhost:3001/api/test`

## Architecture Overview

### System Structure
This is a **Shrimp Contract Management System** with role-based authentication supporting three user types:
- **General Manager**: Creates contracts, sets pricing, manages system
- **Supplier**: Views assigned contracts, fills delivery details
- **Administrator**: Manages database, exports data, system administration

### Technology Stack
- **Backend**: Node.js + Express.js + PostgreSQL
- **Frontend**: React + TypeScript + Tailwind CSS  
- **Database**: PostgreSQL with JSONB for flexible pricing structures
- **Authentication**: JWT tokens with bcrypt password hashing
- **API Documentation**: Swagger/OpenAPI with swagger-ui-express

### Key Backend Components

#### Database Layer (`backend/src/config/database.js`)
- PostgreSQL connection pool with environment-based configuration
- Connection testing and error handling on startup
- Database credentials via environment variables (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD)

#### Authentication System (`backend/src/middleware/auth.js`)
- **`authenticateToken`**: JWT verification middleware that validates Bearer tokens and fetches user data
- **`requireRole([roles])`**: Authorization middleware for role-based access control
- Token validation includes database user lookup for fresh permissions

#### Contract Management (`backend/src/routes/contracts.js` + `backend/src/controllers/contractController.js`)
- **Dynamic pricing system**: Uses PostgreSQL JSONB for flexible size/price configurations
- **Contract types**: "New", "Add", "Change" with different business logic
- **Auto-generated IDs**: Format `L{timestamp}.{random}.00`
- **Role-based filtering**: Users only see contracts they're authorized to access
- **Status management**: "Open"/"Closed" with audit trail

### API Endpoints Structure

#### Authentication (`/api/auth/`)
- `POST /register` - Create new user accounts
- `POST /login` - User authentication with JWT response

#### Contracts (`/api/contracts/`)
- `POST /` - Create contracts (General Managers only)
- `GET /` - List contracts (role-filtered)
- `GET /:id` - Get single contract details
- `PUT /:id/status` - Change contract status (creators only)

#### System (`/api/`)
- `GET /health` - Health check with database status
- `GET /test` - Simple API connectivity test

### Database Schema Key Points
- **Dynamic pricing**: JSONB arrays for size/price configurations
- **Size penalties**: Configurable range-based penalty system
- **Audit logging**: Complete activity tracking with user attribution
- **Role constraints**: Database-level validation for user roles and contract types

### Security Implementation
- **JWT Authentication**: Stateless token-based auth with configurable expiration
- **Password Security**: bcrypt hashing with salt rounds
- **Role-Based Access**: Middleware-enforced authorization checks
- **Input Validation**: SQL injection prevention and data sanitization
- **Environment Separation**: Sensitive data in environment variables only

### Development Notes
- **Port Configuration**: Backend runs on port 3001, frontend on standard React port (3000)
- **CORS Enabled**: Backend configured for cross-origin requests during development
- **Error Handling**: Comprehensive error logging with structured responses
- **Database Connection**: Automatic retry logic and graceful degradation
- **Process Management**: Graceful shutdown handlers for production deployment

### Frontend Architecture (React + TypeScript)
- **Routing**: React Router DOM for navigation
- **State Management**: Custom hooks pattern (see `src/hooks/useAuth.ts`)
- **API Integration**: Axios-based API client (`src/utils/api.ts`)
- **Role-based UI**: Dashboard components per user role (AdminDashboard, GeneralManagerDashboard, SupplierDashboard)
- **Styling**: Tailwind CSS with PostCSS configuration
- **Icons**: Heroicons React library

### Environment Configuration
- **Backend Environment**: Requires `.env` file with database credentials and JWT secrets
- **Frontend Environment**: Standard Create React App environment variable support
- **Development**: Both backend and frontend support hot reloading during development