# JobBoard Features Guide 💡

This document details every core feature of **JobBoard**, explaining how it works and listing the frontend components, backend routers, and database tables implementing it.

---

## 🔑 1. Role-Based JWT Authentication
Handles registration, login, and secure session management for two user roles: **Job Seekers** and **Employers**.

### How it works:
1.  **Sign Up:** Users register specifying their role. If they choose `EMPLOYER`, they must specify a company name. The password is hashed using `bcryptjs` and stored in the database. A default empty profile record is created.
2.  **Login:** Validates credentials and responds with user profile data, a short-lived Access Token (15 mins), and a long-lived Refresh Token (7 days).
3.  **Token Refresh:** The React client interceptor automatically refreshes expired access tokens in the background on receipt of a `401 Unauthorized` response using the stored refresh token.
4.  **Client State:** Persisted via a React Context hook (`useAuth`), making user info and authenticating fetch requests available globally.

### Implemented by:
*   **Database:** `User` and `Profile` models in [schema.prisma](file:///Users/karteeksai/Desktop/job_board/server/prisma/schema.prisma)
*   **Backend Routes:** [auth.js](file:///Users/karteeksai/Desktop/job_board/server/routes/auth.js)
*   **Middleware:** [auth.js](file:///Users/karteeksai/Desktop/job_board/server/middleware/auth.js) (JWT validation & role checks)
*   **Frontend Context:** [AuthContext.jsx](file:///Users/karteeksai/Desktop/job_board/client/src/context/AuthContext.jsx)
*   **Frontend Pages:** [Login.jsx](file:///Users/karteeksai/Desktop/job_board/client/src/pages/Login.jsx) & [Register.jsx](file:///Users/karteeksai/Desktop/job_board/client/src/pages/Register.jsx)
*   **Guard Component:** [ProtectedRoute.jsx](file:///Users/karteeksai/Desktop/job_board/client/src/components/ProtectedRoute.jsx)

---

## 🔍 2. Public Job Listings with Advanced Filters
Enables guests and logged-in users to search and filter open positions.

### How it works:
1.  **Keyword Search:** Queries job title, company name, or description using an insensitive SQL ILIKE match.
2.  **Location Filter:** Allows text filter matching (e.g., "Remote", "San Francisco").
3.  **Job Type / Experience Filters:** Supports multi-select arrays (Full-time, Part-time, Remote, Internship) and experience level checkmarks (Entry, Mid, Senior).
4.  **Salary Range:** Filters jobs whose salary interval caps overlap with user-selected minimum/maximum boundaries.
5.  **Sorting & Pagination:** Sorts results by date posted (newest) or maximum salary (high-to-low). Pages results in batches of 6 using Prisma `skip` and `take`.

### Implemented by:
*   **Database:** `Job` model in [schema.prisma](file:///Users/karteeksai/Desktop/job_board/server/prisma/schema.prisma)
*   **Backend API:** `GET /api/jobs` in [jobs.js](file:///Users/karteeksai/Desktop/job_board/server/routes/jobs.js)
*   **Frontend Page:** [Home.jsx](file:///Users/karteeksai/Desktop/job_board/client/src/pages/Home.jsx) (handles sidebar filters, search state, and pagination)
*   **UI Components:** [JobCard.jsx](file:///Users/karteeksai/Desktop/job_board/client/src/components/JobCard.jsx)

---

## 📄 3. Job Details & Application Modal
Renders description details and offers interactive candidate submission options.

### How it works:
1.  **Views Increment:** Loading the page automatically increments the `views` counter for the job listing in the database.
2.  **Bookmarks Toggle:** Job Seekers can bookmark/save the listing. Toggling deletes or creates a relational row.
3.  **Link Sharing:** Copies the current browser URL to the user's clipboard and triggers a toast notification.
4.  **Application Modal:** Opens a modal form pre-filled with the seeker's profile details.
    *   Allows uploading a new resume document (processed via `Multer` and saved in `server/uploads/`).
    *   Alternatively, seekers can opt to attach their saved profile resume.
5.  **Related Jobs:** Matches the current listing with other postings sharing similar types or locations.

### Implemented by:
*   **Database:** `Job`, `Application`, and `Bookmark` models in [schema.prisma](file:///Users/karteeksai/Desktop/job_board/server/prisma/schema.prisma)
*   **Backend API:**
    *   `GET /api/jobs/:id` in [jobs.js](file:///Users/karteeksai/Desktop/job_board/server/routes/jobs.js)
    *   `POST /api/applications/:jobId` in [applications.js](file:///Users/karteeksai/Desktop/job_board/server/routes/applications.js)
*   **Frontend Page:** [JobDetail.jsx](file:///Users/karteeksai/Desktop/job_board/client/src/pages/JobDetail.jsx)

---

## 💼 4. Job Seeker Dashboard
A private workspace for seekers to track applications and customize resume settings.

### How it works:
*   **Applications Tab:** Lists all submitted roles alongside real-time status banners (Applied, Shortlisted, Hired, Rejected).
*   **Bookmarks Tab:** Lists all saved jobs for quick access, including clear buttons to revoke bookmarks.
*   **Profile Tab:** Edits seeker name, professional title, biography paragraph, and comma-separated skills list. Displays a preview link of their saved resume.

### Implemented by:
*   **Backend API:** [seeker.js](file:///Users/karteeksai/Desktop/job_board/server/routes/seeker.js)
*   **Frontend Page:** [SeekerDashboard.jsx](file:///Users/karteeksai/Desktop/job_board/client/src/pages/SeekerDashboard.jsx)

---

## 📊 5. Employer Dashboard & Analytics
A workspace for employers to publish listings, manage candidates, and track stats.

### How it works:
*   **Analytics Tab:** Renders total listings published, accumulated views across all jobs, total applicants, and a grid summary of candidate pipeline counts.
*   **Manage Postings Tab:** Lists published roles, views/applicant counters per posting, and triggers to edit or delete posts.
*   **Candidate Pipeline Tab:** Displays all candidates who applied, details of their cover letters, links to download their resumes, and a dropdown selector to update candidate pipeline statuses.
*   **Post/Edit Tab:** A full-form page used to post new job roles or update existing listings.

### Implemented by:
*   **Backend API:**
    *   `GET /api/analytics/employer` in [analytics.js](file:///Users/karteeksai/Desktop/job_board/server/routes/analytics.js)
    *   `GET /api/applications/employer` in [applications.js](file:///Users/karteeksai/Desktop/job_board/server/routes/applications.js)
*   **Frontend Page:** [EmployerDashboard.jsx](file:///Users/karteeksai/Desktop/job_board/client/src/pages/EmployerDashboard.jsx)

---

## 🎨 6. Global UX Polish
Improves system layout flows and interaction states:
*   **Dark Mode Toggle:** Integrates local theme toggles in `Navbar.jsx` that add or remove the `.dark` class from `<html>`. Tailwind v4 compiles selectors using native styling.
*   **Shimmer Loading Skeletons:** Styled divs in `SkeletonCard.jsx` showing animated gray gradients during asynchronous load times instead of generic progress spinners.
*   **Toast Notifications:** Dispatches clean success or warning alert cards via `react-hot-toast` for application submissions, profile updates, and authentication state changes.
*   **Form Accessibilities:** Standard input wrappers containing descriptive `<label>` tags, keyboard tab indexing, and clear validation attributes.

### Implemented by:
*   **Styles:** [index.css](file:///Users/karteeksai/Desktop/job_board/client/src/index.css) (shimmer animations, CSS theme configurations)
*   **UI Components:**
    *   [Navbar.jsx](file:///Users/karteeksai/Desktop/job_board/client/src/components/Navbar.jsx) (dark mode theme toggle)
    *   [SkeletonCard.jsx](file:///Users/karteeksai/Desktop/job_board/client/src/components/SkeletonCard.jsx)
    *   [App.jsx](file:///Users/karteeksai/Desktop/job_board/client/src/App.jsx) (Toaster integration)
