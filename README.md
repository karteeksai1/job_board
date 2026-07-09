# JobBoard ⚡

A high-performance, modern full-stack job board web application built with a React frontend, Express.js backend, and PostgreSQL database managed via Prisma ORM. It features dual-role authentication (Job Seekers and Employers), advanced filtering/searching, candidate application pipeline management, and dashboard analytics.

---

## 🚀 Key Features

*   **Public Job Listings:** Title and company search, comprehensive filter drawer (job type, location, experience, salary), sort orders, and card pagination.
*   **Dual-Role Auth System:** Role-based access controls for **Job Seekers** and **Employers** using secure JWT tokens (with auto-refresh logic).
*   **Employer Workspace:** Post/edit/delete job roles, view applicant counts and detailed profiles, move candidates through a pipeline (**Applied → Shortlisted → Rejected/Hired**), and track views analytics.
*   **Seeker Dashboard:** Track submitted applications, manage bookmarks/saved job posts, and maintain a profile featuring professional bios, skills, and resume documents.
*   **Polished UX:** Shimmer loading skeletons, clean toast notifications, empty states with reset CTAs, and a toggleable dark mode theme.

---

## 🛠️ Technology Stack

*   **Frontend:** React, Vite, Tailwind CSS v4, React Router v6, Lucide React, React Hot Toast
*   **Backend:** Express.js (Node.js), Multer (file uploads), JSONWebToken, BcryptJS
*   **Database:** PostgreSQL, Prisma ORM

---

## 📂 Project Structure

```text
job_board/
├── client/                 # Frontend React Application
│   ├── src/
│   │   ├── components/     # Reusable UI (JobCard, Navbar, Skeletons, etc.)
│   │   ├── context/        # Auth Context (JWT & auto-refresh fetch handler)
│   │   ├── pages/          # Pages (Home, Detail, Dashboards, Auth)
│   │   ├── App.jsx         # App Router & routes mappings
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
├── package.json            # Monorepo concurrent script configurations
└── README.md               # Setup Guide
```

---

## ⚙️ Quick Setup Guide

### 1. Prerequisites
Ensure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
*   [npm](https://www.npmjs.com/) (v9.0.0 or higher)
*   A running **PostgreSQL** instance (local server or hosted e.g. [Neon](https://neon.tech/) or [Supabase](https://supabase.com/))

### 2. Configure Environment Variables
Copy `.env.example` at the root folder to `.env`:
```bash
cp .env.example .env
```
Open `.env` and fill in your connection string and security details:
```env
DATABASE_URL="postgresql://<user>:<password>@<host>:<port>/<dbname>?sslmode=require"
JWT_SECRET="your-custom-secure-access-token"
JWT_REFRESH_SECRET="your-custom-secure-refresh-token"
```

### 3. Install Monorepo Dependencies
Install root, client, and server dependencies concurrently by running the following command from the root of the project:
```bash
npm run install-all
```

### 4. Setup Database Schema and Migrations
Generate Prisma files and run migration to spin up the database tables:
```bash
# From the root directory:
npm run db:migrate
```
*Note: Make sure your PostgreSQL database is running and accessible before launching the migration.*

### 5. Seed Database
Execute the database seed script to populate tables with standard developer, designer, and marketer job listings, along with dummy test users:
```bash
# From the root directory:
npm run db:seed
```

### 6. Run Application
Start the frontend and backend servers concurrently in development mode:
```bash
# From the root directory:
npm run dev
```

*   **Frontend Client:** accessible at [http://localhost:5173](http://localhost:5173)
*   **Backend Server API:** accessible at [http://localhost:5000](http://localhost:5000) (requests are automatically proxied from client via Vite server configs)

---

## 🧪 Test Accounts

The seeding script generates two ready-to-use testing accounts (password for both is `password123`):

1.  **Job Seeker:**
    *   **Email:** `seeker@example.com`
    *   **Password:** `password123`
    *   **Description:** Already has 2 job applications submitted (1 Shortlisted, 1 Applied) and 2 bookmarked jobs.
2.  **Employer:**
    *   **Email:** `employer@example.com`
    *   **Password:** `password123`
    *   **Description:** Represents *TechVibe Solutions*. Has posted 7 roles, accumulated views, and has candidates pending in the pipeline review tab.
