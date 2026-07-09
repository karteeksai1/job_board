# JobBoard ⚡

A high-performance, responsive full-stack job board web application built with a React frontend, Express.js backend, and a PostgreSQL database managed via Prisma ORM.

---

## 🎨 System Architecture

Here is the architectural overview of the system, showing how the frontend React SPA, the backend Express REST API, and the PostgreSQL storage layer interact:

```mermaid
graph TD
    subgraph Client [React Frontend - Port 5173]
        UI[Vite React SPA]
        Ctx[Auth Context & JWT state]
        Theme[Dark/Light Theme State]
        UI --> Ctx
        UI --> Theme
    end
    
    subgraph API [Express Backend - Port 5001]
        Server[Express Server]
        AuthMid[Auth Middleware]
        Multer[Multer Uploads Engine]
        
        RouterAuth[Auth Router]
        RouterJobs[Jobs Router]
        RouterApps[Applications Router]
        RouterSeek[Seeker Router]
        RouterAnal[Analytics Router]
        
        Server --> AuthMid
        Server --> RouterAuth
        Server --> RouterJobs
        Server --> RouterApps
        Server --> RouterSeek
        Server --> RouterAnal
    end

    subgraph Storage [Database Layer]
        Prisma[Prisma Client]
        Postgres[(PostgreSQL Database)]
        Uploads[Local Uploads Folder]
        
        RouterAuth --> Prisma
        RouterJobs --> Prisma
        RouterApps --> Prisma
        RouterApps --> Multer
        RouterSeek --> Prisma
        RouterAnal --> Prisma
        
        Multer --> Uploads
        Prisma --> Postgres
    end

    UI -- HTTP Requests & Proxy --> Server
```

---

## 🛠️ Technology Stack

*   **Frontend:** React, Vite, Tailwind CSS v4, React Router v6, Lucide React, React Hot Toast
*   **Backend:** Express.js (Node.js), Multer (file uploads), JSONWebToken, BcryptJS
*   **Database:** PostgreSQL, Prisma ORM
*   **CI/CD:** GitHub Actions workflow

---

## 📂 Folder Structure

```text
job_board/
├── .github/workflows/      # CI configurations
│   └── ci.yml              # GitHub Actions linting & bundling checks
├── client/                 # Frontend React Application
│   ├── src/
│   │   ├── components/     # JobCard, Navbar, Skeleton loaders
│   │   ├── context/        # Auth Context (JWT & auto-refresh fetch handler)
│   │   ├── pages/          # Pages (Home, Detail, Dashboards, Login, Register)
│   │   ├── App.jsx         # App Router setup
│   │   └── index.css       # Tailwind v4 configuration, theme, and keyframes
│   ├── package.json
│   └── vite.config.js      # Vite config with @tailwindcss/vite plugin & proxy
├── server/                 # Backend REST API Service
│   ├── middleware/         # Auth verification middleware
│   ├── prisma/             # Database Client and Migration definitions
│   │   ├── db.js           # Shared database client helper
│   │   ├── schema.prisma   # PostgreSQL Database schema
│   │   └── seed.js         # Seeding script with 15 realistic job postings
│   ├── routes/             # REST Endpoints (auth, jobs, applications, analytics)
│   ├── uploads/            # Static directory for resume file uploads
│   ├── package.json
│   └── server.js           # Express server entry point
├── .env.example            # Environment variables template
├── package.json            # Monorepo script configurations
└── README.md               # Setup Guide
```

---

## ⚙️ Quick Setup & Installation Guide

### 1. Prerequisites
Ensure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/) (v22.0.0 or higher)
*   [npm](https://www.npmjs.com/) (v10.0.0 or higher)
*   A running **PostgreSQL** instance (local server or hosted on [Neon](https://neon.tech/) or [Supabase](https://supabase.com/))

### 2. Configure Environment Variables
Copy `.env.example` at the root folder to `.env`:
```bash
cp .env.example .env
```
Open `.env` and fill in your hosted or local database connection string:
```env
PORT=5001
NODE_ENV=development

# For Neon/Supabase: postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require
# For local Postgres: postgresql://USER:PASSWORD@localhost:5432/DATABASE
DATABASE_URL="postgresql://neondb_owner:npg_ZqUxe3PAf2Qv@ep-young-hat-ad225j83-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# JWT configuration
JWT_SECRET="your-secure-access-token-key"
JWT_REFRESH_SECRET="your-secure-refresh-token-key"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"

# Client configuration
VITE_API_URL="http://localhost:5001"
```

### 3. Install Monorepo Dependencies
Install root, client, and server dependencies concurrently by running the following command from the root of the project:
```bash
npm run install-all
```

*Note: This command will set up the workspace folders and copy/link dependencies cleanly.*

### 4. Setup Database Schema and Migrations
Synchronize your Prisma schema definitions and spin up the database tables in your PostgreSQL instance:
```bash
npm run db:migrate
```
*Note: The CLI will load environments from `/server/.env` automatically. A `.env` file must exist in the root and `/server` folders (copied automatically during set up).*

### 5. Seed the Database
Seed the database with 15 realistic developer, designer, product manager, and technical support job listings, along with dummy test users:
```bash
npm run db:seed
```

### 6. Run the Application
Start the frontend and backend servers concurrently in development mode:
```bash
npm run dev
```

*   **Frontend Client SPA:** accessible at [http://localhost:5173](http://localhost:5173)
*   **Backend Server REST API:** running on [http://localhost:5001](http://localhost:5001) (requests are automatically proxied from client via Vite server configuration to resolve CORS issues)

---

## 🔑 Test Accounts

The seeding script generates two ready-to-use testing accounts (password for both is `password123`):

1.  **Job Seeker:**
    *   **Email:** `seeker@example.com`
    *   **Password:** `password123`
    *   **Features:** Already has 2 job applications submitted (1 Shortlisted, 1 Applied) and 2 bookmarked jobs.
2.  **Employer:**
    *   **Email:** `employer@example.com`
    *   **Password:** `password123`
    *   **Features:** Represents *TechVibe Solutions*. Has posted 7 roles, accumulated views, and has candidates pending in the pipeline review tab.

---

## 💡 Detailed Features Guide
For a full breakdown of every application feature (auth, filtering, bookmarks, dashboards, linter, dark theme), review [FEATURES.md](file:///Users/karteeksai/Desktop/job_board/FEATURES.md).
