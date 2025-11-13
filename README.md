Tavern — Full Stack Setup Guide

This project contains the complete Tavern platform with both backend and frontend. The backend implements authentication (registration, login, JWT token, protected routes), and the frontend includes UI for login, registration, and a protected dashboard.

Project Structure
tavern/
  backend/     ← Node.js + Express + MongoDB + JWT auth
  frontend/    ← React + Vite + TypeScript + TailwindCSS

Prerequisites

Install the following before starting:

Node.js (version 18 or higher)

npm (version 9 or higher)

MongoDB installed locally and running on:
mongodb://127.0.0.1:27017

Git

Clone the Repository
git clone https://github.com/Nyracus/tavern.git
cd tavern


You should see the folders:

backend/
frontend/

Backend Setup
Step 1 — Install dependencies
cd backend
npm install

Step 2 — Create the .env file

Inside backend/, create a file named .env with the following:

MONGO_URI=mongodb://127.0.0.1:27017/tavern_db
PORT=3000
NODE_ENV=local
JWT_SECRET=super_secret_change_me
JWT_EXPIRES_IN=7d


Make sure MongoDB is running.

Step 3 — Start the backend
npm run dev


You should see:

MongoDB connected
Tavern backend listening on port 3000

Auth API Endpoints

Base URL: http://localhost:3000/api

Method	Route	Description
POST	/auth/register	Register new user
POST	/auth/login	Login and receive JWT
GET	/auth/me	Get authenticated user
Frontend Setup
Step 1 — Install dependencies

Open a second terminal:

cd frontend
npm install

Step 2 — Create the .env file

Inside frontend/, create:

VITE_API_URL=http://localhost:3000/api

Step 3 — Start the frontend
npm run dev


Vite will show a URL such as:

http://localhost:5173/


Open it in the browser.

How to Test Authentication
Register a user

Navigate to:

http://localhost:5173/register


Fill out:

ID (example: hero-1)

Email

Username

Display Name

Password

Role (ADVENTURER, NPC, or GUILD_MASTER)

Submit the form.
You will be automatically logged in.

Login

Go to:

http://localhost:5173/login


Use either email or username and the password you registered with.

Dashboard

After logging in, you are redirected to the dashboard, which displays:

User ID

Username

Email

Display Name

Role

This dashboard uses the protected backend endpoint:

GET /auth/me


with the JWT token stored in localStorage.

How to Test Using Thunder Client or Postman
Register
POST http://localhost:3000/api/auth/register


Body:

{
  "id": "hero-1",
  "email": "hero@example.com",
  "username": "bravehero",
  "displayName": "Brave Hero",
  "password": "secret123",
  "role": "ADVENTURER"
}

Login
POST http://localhost:3000/api/auth/login


Body:

{
  "emailOrUsername": "bravehero",
  "password": "secret123"
}


Copy the token from the response.

Get Current User
GET http://localhost:3000/api/auth/me


Headers:

Authorization: Bearer <token>
