# [DEMO] BMS Seafood Contract Management System 

## Project Description

A comprehensive full-stack web application that digitizes and automates the entire seafood contract management process for shrimp purchasing businesses. This system transforms manual WhatsApp-based communications and Excel spreadsheet workflows into a streamlined digital platform, enabling real-time contract creation, negotiation, and data management across multiple suppliers.

Built with modern web technologies (React + TypeScript frontend, Node.js + PostgreSQL backend), the application serves three distinct user roles: General Managers who create and manage contracts with complex pricing structures, Suppliers who input delivery details and quantities, and Administrators who oversee system-wide data and user management.

## Workflow Overview

### Traditional Manual Process (Before)
1. **Contract Creation**: Manager manually creates contract templates
2. **Distribution**: Templates sent to suppliers via WhatsApp  
3. **Response Collection**: Suppliers respond with quantities and dates via WhatsApp
4. **Negotiation**: Back-and-forth WhatsApp messages for price/quantity adjustments
5. **Finalization**: Final contracts sent to administrator via WhatsApp
6. **Data Entry**: Administrator manually inputs all contract data into Excel spreadsheets

### Automated Digital Process (After)
1. **Digital Contract Creation**: GM creates contracts with dynamic pricing tables in the web interface
2. **Instant Distribution**: Suppliers automatically receive contract notifications in their dashboard
3. **Online Input**: Suppliers directly input quantities and delivery dates through the web interface
4. **Real-time Negotiation**: GM can adjust prices and quantities instantly, with immediate supplier visibility
5. **Automatic Processing**: Closed contracts are transferred to the database system with one click
6. **Centralized Data Management**: All contract data automatically captured and available in admin dashboard


## Features

- **Role-based Authentication** (General Manager, Supplier, Administrator)
- **Dynamic Pricing System** (handles any shrimp sizes using PostgreSQL JSONB)
- **Real-time Contract Collaboration**
- **WhatsApp Integration** (coming soon)
- **Excel Import/Export** (coming soon)

 
<img src="https://github.com/user-attachments/assets/bba8c2f0-a086-4276-a533-d6c425e60fe5" alt="Screenshot 1" width="400">
<img src="https://github.com/user-attachments/assets/25872bcb-79df-4b90-b1ab-98bcfa2bb5a5" alt="Screenshot 2" width="400">
<img src="https://github.com/user-attachments/assets/bad927b6-f657-47f0-a99e-41a422b8615b" alt="Screenshot 3" width="400">
<img src="https://github.com/user-attachments/assets/b1c525fd-0bba-49fe-9491-445b76f83cd3" alt="Screenshot 4" width="400">



## Architecture

- **Backend**: Node.js + Express + PostgreSQL
- **Frontend**: React + TypeScript + Tailwind CSS (coming soon)
- **Database**: PostgreSQL with JSONB for dynamic pricing
- **Authentication**: JWT tokens with bcrypt password hashing

## Getting Started

### Prerequisites
- Node.js v18+
- PostgreSQL 15+
- npm or yarn

### Backend Setup

1. **Clone the repository**
   git clone <your-repo-url>
   cd ContractManagement_BMS_Github/backend
   
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

## Security Setup

**IMPORTANT**: Never commit your `.env` file to version control. This repository includes:

- `.env.example` - Template with placeholder values
- `.gitignore` - Properly configured to exclude sensitive files

**Required Environment Variables:**
- `DB_PASSWORD` - Your PostgreSQL password
- `JWT_SECRET` - Generate a secure random string (minimum 32 characters)
- Other database credentials as needed

API Endpoints
Authentication

POST /api/auth/register - Create new user
POST /api/auth/login - User login

System

GET /api/health - Health check with database status
GET /api/test - Simple API test

User Roles

General Manager: Creates contracts, sets pricing, manages system
Supplier: Fills delivery details, responds to contracts
Administrator: Manages database, exports data, system administration

Security Features

Password hashing with bcryptjs
JWT token authentication
Input validation and sanitization
SQL injection prevention
Role-based access control

Database Schema

users: User accounts with role-based access
contracts: Contract data with JSONB for dynamic pricing
audit_logs: Complete activity tracking

Testing
Test the API using Postman or curl:
bash# Health check
curl http://localhost:3001/api/health

# Register user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"gm@test.com","name":"General Manager","password":"password123","role":"general_manager"}'

## Development Status

✅ Backend API with authentication
✅ PostgreSQL database with dynamic pricing
✅ Role-based access control
✅ Contract transfer to database system
✅ React frontend with TypeScript
✅ Dynamic pricing calculator with interpolation
✅ Role-based dashboards (GM, Supplier, Admin)

## Next Implementation Priorities

### High Priority (Core Business Features)

1. **Data Export System**
   - Excel export for transferred contract data
   - PDF contract generation
   - Custom date range filtering for exports


2. **Contract Template System**
   - Save frequently used pricing configurations as templates
   - Quick contract creation from templates
   - Template sharing between General Managers

3. **Real-time Notifications**
   - Email/SMS notifications for contract updates
   - In-app notification system
   - Supplier alerts for new contracts requiring input

### Future Enhancements
4. **WhatsApp Integration**
   - Automated contract sharing via WhatsApp API
   - Status update notifications
   - Integration with existing supplier communication
5. **Mobile Responsive Design**
   - Supplier mobile app for contract viewing
   - Touch-optimized interface
   - Offline capability for delivery input

6. **Advanced Security & Audit**
   - Enhanced audit logging
   - Role permission granularity
   - Data backup automation
   - **Business Impact**: Enterprise-grade security compliance

---

