# Assignment 2 - Quick Setup Guide

## Prerequisites
- Node.js 18+ and npm
- MongoDB running locally on `mongodb://127.0.0.1:27017`
- Git

## Setup Steps

### 1. Clone & Install Dependencies

```bash
# Backend
cd tavern-backend
npm install

# Frontend (in a new terminal)
cd tavern-frontend
npm install
```

### 2. Backend Environment

Create `tavern-backend/.env`:
```env
MONGO_URI=mongodb://127.0.0.1:27017/tavern_db
PORT=3000
NODE_ENV=local
JWT_SECRET=super_secret_change_me
JWT_EXPIRES_IN=7d
TEST_MONGO_URI=mongodb://127.0.0.1:27017/tavern_test
```

### 3. Frontend Environment

Create `tavern-frontend/.env`:
```env
VITE_API_URL=http://localhost:3000/api
```

### 4. Run the Project

**Terminal 1 - Backend:**
```bash
cd tavern-backend
npm run dev
```
Should show: `Tavern backend listening on port 3000`

**Terminal 2 - Frontend:**
```bash
cd tavern-frontend
npm run dev
```
Open: `http://localhost:5173`

### 5. Run Tests

```bash
cd tavern-backend
npm test
```

## Quick Test

1. Go to `http://localhost:5173/register`
2. Register an account (role: ADVENTURER, NPC, or GUILD_MASTER)
3. Login at `http://localhost:5173/login`
4. Access dashboard

## Project Structure
- `tavern-backend/` - Express API server
- `tavern-frontend/` - React frontend
- API Base: `http://localhost:3000/api`

That's it! 🎉

