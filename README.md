# JobBoard

A unified, full-stack career platform connecting developers with opportunities.

[Live Demo](your-vercel-url-here)

## Overview
JobBoard is a full-stack career application designed to streamline the recruitment process. Job seekers can browse, filter, bookmark, and apply for roles with resume uploads, while employers can publish listings, view metrics, and manage candidates through a recruitment pipeline.

## Features

### Job Seeker Features
*   **Search & Filter**: Browse job listings with instant queries filtering by keywords, location, type (Full-time, Part-time, Remote, Internship), experience level, and salary ranges.
*   **Bookmarks**: Save job listings to a personal list to apply or review later.
*   **Application Submission**: Apply directly to jobs using a saved profile resume or by uploading a new file.
*   **Application Tracking**: Monitor application statuses (Applied, Shortlisted, Hired, Rejected) from a dedicated seeker dashboard.
*   **Profile Management**: Update professional title, bio, skills, and save a primary resume document.

### Employer Features
*   **Listing Management**: Post new job listings and edit, update, or delete existing postings.
*   **Applicant Dashboard**: View all applications submitted to company listings, including candidate bios, skills, and covers.
*   **Recruitment Pipeline**: Progress candidate statuses dynamically (Applied -> Shortlisted -> Hired/Rejected).
*   **Workspace Analytics**: View dashboard metrics tracking total listings, view counts, total applicants, and a pipeline status breakdown.

### Shared & Platform Features
*   **JWT Cookie Authentication**: Secure session management using HTTP-Only cookies with automatic server-side token refreshing.
*   **Dark Mode**: Native, responsive light/dark theme preference toggle.
*   **Responsive Design**: Fluid, mobile-first interface optimized for desktop, tablet, and mobile browsers.

## Tech Stack

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js 14 / 15 (App Router) | Unified layout routing, React rendering, and static site optimizations |
| **Backend Framework** | Next.js Route Handlers | Serverless API routes replacing standalone Express servers |
| **Database** | PostgreSQL | Relational database hosting job listings, applications, and user profiles |
| **ORM** | Prisma ORM | Schema modeling, migrations management, and database queries |
| **Authentication** | JSON Web Tokens (JWT) | Secure session authentication signed via cookies |
| **File Storage** | Vercel Blob / Local Storage | Cloud-native resume file storage with offline filesystem fallback |
| **Styling** | Tailwind CSS v4 & PostCSS | Utility-first CSS compiling responsive custom layouts |

## Architecture

The following diagram illustrates the application data flow, authentication, and storage architecture:

```mermaid
graph TD
    subgraph Client [Browser Client]
        UI[Next.js App Pages]
        AuthCtx[Auth Context]
        Theme[Theme Toggle]
    end

    subgraph API [Next.js Route Handlers]
        AuthAPI[api/auth/*]
        JobsAPI[api/jobs/*]
        AppAPI[api/applications/*]
        AnalyticsAPI[api/analytics/*]
        Middleware[Edge Middleware]
    end

    subgraph Services [External & Cloud Services]
        Blob[Vercel Blob Storage]
        LocalFS[Local uploads/ folder]
    end

    subgraph Database [Database Layer]
        Prisma[Prisma Client]
        Postgres[(PostgreSQL DB)]
    end

    %% Client and Middleware flow
    UI -->|1. Route requests| Middleware
    Middleware -->|2. Validate cookies| UI
    UI -->|3. Fetch data| API

    %% Authentication Flow
    AuthAPI <-->|JWT Cookies| AuthCtx

    %% File Upload Flow
    AppAPI -->|If Vercel token| Blob
    AppAPI -->|Else dev fallback| LocalFS

    %% DB Query Flow
    API --> Prisma
    Prisma <--> Postgres
```

## Getting Started

### Prerequisites
*   Node.js (version `>=20.0.0`)
*   PostgreSQL database instance (e.g., Neon serverless PostgreSQL account)

### Setup Instructions

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/karteeksai1/job_board.git
    cd job_board
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**
    Create a `.env` and `.env.local` file in the root directory:
    ```bash
    cp .env.example .env
    cp .env.example .env.local
    ```
    Populate the variables in the file (refer to the [Environment Variables](#environment-variables) section below).

4.  **Database Migration & Client Generation**
    Push schemas and generate the Prisma client:
    ```bash
    npx prisma generate
    npx prisma db push
    ```

5.  **Seed the Database (Optional)**
    Populate the database with demo seekers, employers, and 15 job listings:
    ```bash
    npm run db:seed
    ```

6.  **Run Locally**
    Start the local Next.js development server:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

| Variable Name | Description | Example / Source |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection URL string | `postgresql://user:pass@host:port/db?sslmode=require` |
| `JWT_SECRET` | Secret key used to sign JWT Access Tokens | Random 32+ character string |
| `JWT_REFRESH_SECRET` | Secret key used to sign JWT Refresh Tokens | Random 32+ character string |
| `JWT_ACCESS_EXPIRY` | Duration of access token validity | `15m` |
| `JWT_REFRESH_EXPIRY` | Duration of refresh token validity | `7d` |
| `BLOB_READ_WRITE_TOKEN` | Token for Vercel Blob cloud storage uploads | Generated via Vercel Dashboard (optional for local) |

## Folder Structure

```
job_board/
├── prisma/
│   ├── schema.prisma        # Database schema definitions
│   └── seed.ts              # Database seed script (mock users, listings)
├── public/
│   └── uploads/             # Dev storage folder for uploaded resumes
└── src/
    ├── app/
    │   ├── api/             # Serverless backend endpoints
    │   ├── employer/        # Employer recruitment panel
    │   ├── jobs/            # Job listing cards & details modal
    │   ├── login/           # Auth login screen
    │   ├── register/        # Auth registration screen
    │   ├── seeker/          # Seeker tracker dashboard
    │   ├── globals.css      # Core css imports (Tailwind v4 reset)
    │   ├── layout.tsx       # Root layout provider
    │   └── page.tsx         # Job browse listings page
    ├── components/          # Reusable shared UI widgets (Navbar, JobCard)
    ├── context/             # Global contexts (AuthContext provider)
    ├── lib/                 # Core client singletons (Prisma client instance)
    └── middleware.ts        # Edge authentication router redirects
```

## Deployment

This application is configured for deployment on **Vercel**:
*   **CI/CD Pipeline**: GitHub Actions runs lint, build, and test steps on every pull request to compile checking types and catch compilation errors.
*   **Vercel Auto-Deployment**: Vercel integrates directly with the GitHub repository, automatically triggering production deployments upon successful merges to the `main` branch.

## License

This project is licensed under the [MIT License](LICENSE).
