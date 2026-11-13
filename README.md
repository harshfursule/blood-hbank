# 🩸 Blood Bank Management System

A full-stack Blood Bank Management System built with **React 18 + JavaScript** (frontend) and **Node.js + Express + MongoDB** (backend).

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, JavaScript, Vite, Tailwind CSS |
| State | Zustand, TanStack Query |
| Forms | React Hook Form + Zod |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Cache | Redis (ioredis) |
| Auth | JWT + Refresh Tokens |
| Notifications | Nodemailer + Twilio |
| Files | Multer + Cloudinary |

## Getting Started

### Prerequisites
- Node.js >= 20
- MongoDB Atlas account (or local MongoDB)
- Redis instance

### 1. Clone & install

```bash
# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 2. Environment Variables

```bash
# Server
cp server/.env.example server/.env
# Fill in MONGO_URI, Redis, JWT secrets, etc.

# Client
echo "VITE_API_URL=http://localhost:5000/api" > client/.env
```

### 3. Run with Docker (recommended for local dev)

```bash
docker-compose up -d
```

### 4. Run manually

```bash
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
cd client && npm run dev
```

Frontend: http://localhost:5173  
Backend:  http://localhost:5000/api/health


