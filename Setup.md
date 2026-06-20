```markdown
# BenchAstra - Job Talent Marketplace

## 📋 Overview

BenchAstra is a comprehensive job talent marketplace platform that connects clients (employers) with vendors (talent providers). The platform features AI-powered matching, resource management, contract management, and real-time analytics.

## 🚀 Features

### For Clients
- Post job requirements
- Search & filter qualified talent
- AI-powered candidate matching
- Manage placements & contracts
- Track billing and subscriptions

### For Vendors
- List available resources
- Receive AI-matched job requirements
- Manage placements & contracts
- Track resource availability
- View analytics dashboard

## 🛠️ Tech Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- Vite for build tooling
- Lucide React for icons
- Context API for state management

### Backend
- FastAPI (Python 3.10+)
- SQLAlchemy ORM
- PostgreSQL / SQLite
- JWT Authentication
- Pydantic for data validation


## 🚀 Installation & Setup

### Prerequisites

- Python 3.10 or higher
- Node.js 18 or higher
- npm or yarn
- Git

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv benchbridge
   ```

3. **Activate virtual environment**

   **Windows (PowerShell):**
   ```powershell
   .\benchbridge\Scripts\Activate.ps1
   ```
   
   **If execution policy blocks it, run once:**
   ```powershell
   Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```
   
   **Windows (CMD):**
   ```cmd
   benchbridge\Scripts\activate.bat
   ```
   
   **Mac/Linux:**
   ```bash
   source benchbridge/bin/activate
   ```

   You should see `(benchbridge)` in your terminal prompt.

4. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

5. **Set up environment variables**
   
Edit the .env file


6. **Run the backend server**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   
   The API will be available at: `http://localhost:8000`
   API Documentation: `http://localhost:8000/docs`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```
   
   or if using yarn:
   ```bash
   yarn install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```
   
   or:
   ```bash
   yarn dev
   ```

4. **Open the application**
   
   The frontend will be available at: `http://localhost:5173`

## 🔑 Default Test Accounts

After setting up the database, you can use these test accounts:

### Client Account
- Email: `client@test.com`
- Password: `BenchAstra@2025`

### Vendor Account
- Email: `vendor@test.com`
- Password: `BenchAstra@2025`

> **Note**: OTP verification uses static code `123456` for testing purposes.

## 🎨 Key Features Details

### Authentication Flow
1. User logs in with email/password
2. After successful login, user selects role (Client or Vendor)
3. Role is stored in localStorage and used for portal routing

### Toast Notifications
The application uses a custom toast notification system for user feedback:
- Success (green) - For successful operations
- Error (red) - For errors and failures
- Warning (yellow) - For warnings
- Info (blue) - For informational messages

### Bulk Upload Feature
- Supports CSV, XLS, XLSX files
- Provides downloadable template
- Validates file format and data structure
- Shows progress and success count

### Profile Management
- Update profile picture (stored in database)
- Edit full name and phone number
- View email (read-only)
- Role badge display
