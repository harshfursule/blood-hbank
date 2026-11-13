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

## Project Phases

| Phase | Status |
|---|---|
| Phase 1 — Setup & Foundation | ✅ Done |
| Phase 2 — Auth & Roles | 🔜 Next |
| Phase 3 — Donor Module | ⏳ Pending |
| Phase 4 — Blood Inventory | ⏳ Pending |
| Phase 5 — Requests & Dispatch | ⏳ Pending |
| Phase 6 — Notifications | ⏳ Pending |
| Phase 7 — Dashboard & Reports | ⏳ Pending |
| Phase 8 — Testing | ⏳ Pending |
| Phase 9 — Deployment | ⏳ Pending |
