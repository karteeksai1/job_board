# API Documentation

This document specifies the REST API endpoints available in the JobBoard application, outlining their request/response shapes, authentication levels, and error codes.

---

## Authentication Endpoints

### Register User
*   **Method**: `POST`
*   **Path**: `/api/auth/signup`
*   **Auth Required**: No (Guest)
*   **Request Body**:
    ```json
    {
      "email": "seeker@example.com",
      "password": "password123",
      "name": "Jane Doe",
      "role": "JOB_SEEKER",
      "companyName": "TechVibe Solutions" // Optional, Employer only
    }
    ```
*   **Success Response** (Status `201 Created`):
    ```json
    {
      "message": "Registration successful",
      "user": {
        "id": "u-uuid-string",
        "email": "seeker@example.com",
        "name": "Jane Doe",
        "role": "JOB_SEEKER"
      }
    }
    ```
*   **Error Responses**:
    - `400 Bad Request`: If mandatory fields are missing, or role is invalid, or email already exists.
    - `500 Internal Server Error`: For database or server issues.

---

### Authenticate User
*   **Method**: `POST`
*   **Path**: `/api/auth/login`
*   **Auth Required**: No (Guest)
*   **Request Body**:
    ```json
    {
      "email": "seeker@example.com",
      "password": "password123"
    }
    ```
*   **Success Response** (Status `200 OK` - Sets `accessToken` & `refreshToken` HTTP-Only cookies):
    ```json
    {
      "message": "Login successful",
      "user": {
        "id": "u-uuid-string",
        "email": "seeker@example.com",
        "name": "Jane Doe",
        "role": "JOB_SEEKER",
        "companyName": null
      }
    }
    ```
*   **Error Responses**:
    - `400 Bad Request`: Missing email or password.
    - `401 Unauthorized`: Invalid email or password.
    - `500 Internal Server Error`: Server connection issue.

---

### Terminate Session
*   **Method**: `POST`
*   **Path**: `/api/auth/logout`
*   **Auth Required**: Yes
*   **Request Body**: None
*   **Success Response** (Status `200 OK` - Clears auth cookies):
    ```json
    {
      "message": "Logout successful"
    }
    ```
*   **Error Responses**:
    - `500 Internal Server Error`: Failed clearing cookies.

---

### Silent Token Refresh
*   **Method**: `POST`
*   **Path**: `/api/auth/refresh`
*   **Auth Required**: Yes (Requires valid `refreshToken` cookie)
*   **Request Body**: None
*   **Success Response** (Status `200 OK` - Sets new `accessToken` cookie):
    ```json
    {
      "message": "Token refreshed successfully"
    }
    ```
*   **Error Responses**:
    - `400 Bad Request`: Missing refresh token cookie.
    - `403 Forbidden`: Expired or corrupted refresh token.
    - `404 Not Found`: User matching token no longer exists.
    - `500 Internal Server Error`: Server-side lookup issue.

---

### Retrieve Current User Session
*   **Method**: `GET`
*   **Path**: `/api/auth/me`
*   **Auth Required**: Yes (Requires valid `accessToken` cookie)
*   **Request Body**: None
*   **Success Response** (Status `200 OK`):
    ```json
    {
      "user": {
        "id": "u-uuid-string",
        "email": "seeker@example.com",
        "name": "Jane Doe",
        "role": "JOB_SEEKER",
        "createdAt": "2026-07-09T12:00:00.000Z",
        "profile": {
          "bio": "Developer bio...",
          "title": "Software Engineer",
          "resumeUrl": "/uploads/filename.pdf",
          "skills": "React, Node.js",
          "companyName": null,
          "companyLogo": null,
          "companyWebsite": null
        }
      }
    }
    ```
*   **Error Responses**:
    - `401 Unauthorized`: Missing token or token expired (`TOKEN_EXPIRED`).
    - `404 Not Found`: User matching token does not exist in the database.
    - `500 Internal Server Error`: Profile retrieval error.

---

## Job Management Endpoints

### Query Job Listings
*   **Method**: `GET`
*   **Path**: `/api/jobs`
*   **Auth Required**: No (Public)
*   **Query Parameters**:
    - `search` (string): Keyword search filter.
    - `location` (string): Location filter (e.g. "Remote").
    - `jobType` (string): Comma-separated types (`FULL_TIME`, `PART_TIME`, `REMOTE`, `INTERNSHIP`).
    - `experienceLevel` (string): Comma-separated levels (`ENTRY`, `MID`, `SENIOR`).
    - `salaryMin` (number): Minimum salary filter.
    - `salaryMax` (number): Maximum salary filter.
    - `sortBy` (string): Sorting order (`newest`, `salary_high_low`). Default: `newest`.
    - `page` (number): Target page number. Default: `1`.
    - `limit` (number): Items per page. Default: `10`.
*   **Success Response** (Status `200 OK`):
    ```json
    {
      "jobs": [
        {
          "id": "j-uuid-string",
          "employerId": "u-uuid-string",
          "title": "React Engineer",
          "companyName": "TechVibe Solutions",
          "companyLogo": "⚡",
          "location": "Remote",
          "jobType": "REMOTE",
          "experienceLevel": "MID",
          "salaryMin": 90000,
          "salaryMax": 120000,
          "description": "Job description details...",
          "requirements": "React skills...\nGit experience...",
          "responsibilities": "Write CSS...\nFix bugs...",
          "views": 42,
          "createdAt": "2026-07-09T12:00:00.000Z",
          "updatedAt": "2026-07-09T12:00:00.000Z",
          "employer": {
            "name": "John Smith",
            "profile": {
              "companyLogo": "⚡"
            }
          }
        }
      ],
      "pagination": {
        "total": 1,
        "page": 1,
        "limit": 10,
        "totalPages": 1
      }
    }
    ```
*   **Error Responses**:
    - `500 Internal Server Error`: Failed searching database.

---

### Publish Job Listing
*   **Method**: `POST`
*   **Path**: `/api/jobs`
*   **Auth Required**: Yes (Employer role only)
*   **Request Body**:
    ```json
    {
      "title": "React Engineer",
      "companyName": "TechVibe Solutions",
      "companyLogo": "⚡", // Optional
      "location": "Remote",
      "jobType": "REMOTE",
      "experienceLevel": "MID",
      "salaryMin": 90000, // Optional
      "salaryMax": 120000, // Optional
      "description": "Job details...",
      "requirements": "React...", // Optional
      "responsibilities": "Code..." // Optional
    }
    ```
*   **Success Response** (Status `201 Created`):
    ```json
    {
      "message": "Job posting created successfully",
      "job": {
        "id": "j-uuid-string",
        "employerId": "u-uuid-string",
        "title": "React Engineer",
        "companyName": "TechVibe Solutions",
        "companyLogo": "⚡",
        "location": "Remote",
        "jobType": "REMOTE",
        "experienceLevel": "MID",
        "salaryMin": 90000,
        "salaryMax": 120000,
        "description": "Job details...",
        "requirements": "React...",
        "responsibilities": "Code...",
        "views": 0,
        "createdAt": "2026-07-09T12:00:00.000Z",
        "updatedAt": "2026-07-09T12:00:00.000Z"
      }
    }
    ```
*   **Error Responses**:
    - `400 Bad Request`: Missing mandatory parameters.
    - `403 Forbidden`: Logged-in user is not an Employer.
    - `500 Internal Server Error`: Database insert failure.

---

### Retrieve Job Details
*   **Method**: `GET`
*   **Path**: `/api/jobs/[id]`
*   **Auth Required**: No (Public - Increments view count by 1)
*   **Success Response** (Status `200 OK`):
    ```json
    {
      "job": {
        "id": "j-uuid-string",
        "employerId": "u-uuid-string",
        "title": "React Engineer",
        "companyName": "TechVibe Solutions",
        "companyLogo": "⚡",
        "location": "Remote",
        "jobType": "REMOTE",
        "experienceLevel": "MID",
        "salaryMin": 90000,
        "salaryMax": 120000,
        "description": "Job details...",
        "requirements": "React...",
        "responsibilities": "Code...",
        "views": 43,
        "createdAt": "2026-07-09T12:00:00.000Z",
        "employer": {
          "id": "u-uuid-string",
          "name": "John Smith",
          "email": "employer@example.com",
          "profile": {
            "companyName": "TechVibe Solutions",
            "companyLogo": "⚡",
            "companyWebsite": "https://techvibe.example.com",
            "bio": "Company description..."
          }
        }
      },
      "relatedJobs": [
        {
          "id": "j-other-uuid",
          "title": "Frontend Engineer",
          "companyName": "TechVibe Solutions",
          "jobType": "REMOTE",
          "location": "Remote",
          "createdAt": "2026-07-09T12:00:00.000Z"
        }
      ]
    }
    ```
*   **Error Responses**:
    - `404 Not Found`: Job ID does not exist in the database.
    - `500 Internal Server Error`: Details parsing error.

---

### Edit Job Listing
*   **Method**: `PUT`
*   **Path**: `/api/jobs/[id]`
*   **Auth Required**: Yes (Employer owner only)
*   **Request Body**:
    ```json
    {
      "title": "Senior React Engineer",
      "companyName": "TechVibe Solutions",
      "location": "Remote",
      "jobType": "REMOTE",
      "experienceLevel": "SENIOR",
      "salaryMin": 130000,
      "salaryMax": 160000,
      "description": "Updated description...",
      "requirements": "Updated requirements...",
      "responsibilities": "Updated responsibilities..."
    }
    ```
*   **Success Response** (Status `200 OK`):
    ```json
    {
      "message": "Job posting updated successfully",
      "job": {
        "id": "j-uuid-string",
        "title": "Senior React Engineer",
        "location": "Remote",
        "jobType": "REMOTE",
        "experienceLevel": "SENIOR",
        "salaryMin": 130000,
        "salaryMax": 160000,
        "description": "Updated description..."
        // other fields...
      }
    }
    ```
*   **Error Responses**:
    - `403 Forbidden`: User is not an employer, or is not the creator of this posting.
    - `404 Not Found`: Job ID does not exist.
    - `500 Internal Server Error`: Update query failed.

---

### Delete Job Listing
*   **Method**: `DELETE`
*   **Path**: `/api/jobs/[id]`
*   **Auth Required**: Yes (Employer owner only)
*   **Request Body**: None
*   **Success Response** (Status `200 OK`):
    ```json
    {
      "message": "Job posting deleted successfully"
    }
    ```
*   **Error Responses**:
    - `403 Forbidden`: User is not an employer, or is not the creator of this posting.
    - `404 Not Found`: Job ID does not exist.
    - `500 Internal Server Error`: Delete query failed.

---

## Application Endpoints

### Submit Application
*   **Method**: `POST`
*   **Path**: `/api/applications/[jobId]`
*   **Auth Required**: Yes (Job Seeker role only)
*   **Request Body**: Multipart Form Data
    - `name` (string): Applicant name.
    - `email` (string): Applicant email.
    - `coverLetter` (string): Optional letter body.
    - `resume` (File): PDF/Doc resume document (optional if using profile resume).
*   **Success Response** (Status `201 Created`):
    ```json
    {
      "message": "Application submitted successfully",
      "application": {
        "id": "a-uuid-string",
        "jobId": "j-uuid-string",
        "seekerId": "u-uuid-string",
        "name": "Jane Doe",
        "email": "seeker@example.com",
        "resumeUrl": "/uploads/filename.pdf", // or vercel blob URL
        "coverLetter": "Cover letter text...",
        "status": "APPLIED",
        "createdAt": "2026-07-09T12:00:00.000Z"
      }
    }
    ```
*   **Error Responses**:
    - `400 Bad Request`: Missing name/email, or missing resume file, or user has already applied.
    - `403 Forbidden`: User is not a Job Seeker.
    - `404 Not Found`: Job ID does not exist.
    - `500 Internal Server Error`: File storage write or DB insert failure.

---

### View Received Applications
*   **Method**: `GET`
*   **Path**: `/api/applications/employer`
*   **Auth Required**: Yes (Employer role only)
*   **Request Body**: None
*   **Success Response** (Status `200 OK`):
    ```json
    {
      "applications": [
        {
          "id": "a-uuid-string",
          "jobId": "j-uuid-string",
          "seekerId": "u-uuid-string",
          "name": "Jane Doe",
          "email": "seeker@example.com",
          "resumeUrl": "/uploads/filename.pdf",
          "coverLetter": "Cover letter text...",
          "status": "APPLIED",
          "createdAt": "2026-07-09T12:00:00.000Z",
          "job": {
            "id": "j-uuid-string",
            "title": "React Engineer",
            "companyName": "TechVibe Solutions"
          },
          "seeker": {
            "name": "Jane Doe",
            "email": "seeker@example.com",
            "profile": {
              "bio": "Seeker bio...",
              "skills": "React, Node"
            }
          }
        }
      ]
    }
    ```
*   **Error Responses**:
    - `403 Forbidden`: User is not an Employer.
    - `500 Internal Server Error`: Retrieval error.

---

### Update Candidate Pipeline Status
*   **Method**: `PATCH`
*   **Path**: `/api/applications/status/[id]`
*   **Auth Required**: Yes (Employer owner only)
*   **Request Body**:
    ```json
    {
      "status": "SHORTLISTED" // "APPLIED", "SHORTLISTED", "REJECTED", "HIRED"
    }
    ```
*   **Success Response** (Status `200 OK`):
    ```json
    {
      "message": "Application status updated to SHORTLISTED",
      "application": {
        "id": "a-uuid-string",
        "status": "SHORTLISTED"
        // other fields...
      }
    }
    ```
*   **Error Responses**:
    - `400 Bad Request`: Missing or invalid status string value.
    - `403 Forbidden`: User is not the employer owner of the target job posting.
    - `404 Not Found`: Application ID does not exist.
    - `500 Internal Server Error`: DB update failure.

---

## Seeker Dashboard Endpoints

### Retrieve Seeker Dashboard State
*   **Method**: `GET`
*   **Path**: `/api/seeker/dashboard`
*   **Auth Required**: Yes (Job Seeker role only)
*   **Request Body**: None
*   **Success Response** (Status `200 OK`):
    ```json
    {
      "applications": [
        {
          "id": "a-uuid-string",
          "status": "SHORTLISTED",
          "createdAt": "2026-07-09T12:00:00.000Z",
          "job": {
            "id": "j-uuid-string",
            "title": "React Engineer",
            "companyName": "TechVibe Solutions",
            "companyLogo": "⚡",
            "location": "Remote",
            "jobType": "REMOTE",
            "salaryMin": 90000,
            "salaryMax": 120000
          }
        }
      ],
      "bookmarks": [
        {
          "id": "b-uuid-string",
          "job": {
            "id": "j-other-uuid",
            "title": "Product Designer",
            "companyName": "TechVibe Solutions",
            "companyLogo": "⚡",
            "location": "Remote",
            "jobType": "FULL_TIME",
            "salaryMin": 80000,
            "salaryMax": 100000,
            "createdAt": "2026-07-09T12:00:00.000Z"
          }
        }
      ]
    }
    ```
*   **Error Responses**:
    - `403 Forbidden`: User is not a Job Seeker.
    - `500 Internal Server Error`: Dashboard aggregation failure.

---

### Toggle Saved Job Bookmark
*   **Method**: `POST`
*   **Path**: `/api/seeker/bookmarks/[jobId]`
*   **Auth Required**: Yes (Job Seeker role only)
*   **Request Body**: None
*   **Success Response** (Status `200 OK`):
    - *If bookmark was added*:
      ```json
      {
        "bookmarked": true,
        "message": "Job bookmarked successfully"
      }
      ```
    - *If bookmark was removed*:
      ```json
      {
        "bookmarked": false,
        "message": "Job bookmark removed"
      }
      ```
*   **Error Responses**:
    - `403 Forbidden`: User is not a Job Seeker.
    - `404 Not Found`: Job ID does not exist in the database.
    - `500 Internal Server Error`: Bookmark query failure.

---

### Update Seeker Profile Info
*   **Method**: `PUT`
*   **Path**: `/api/seeker/profile`
*   **Auth Required**: Yes (Job Seeker role only)
*   **Request Body**:
    ```json
    {
      "name": "Jane Doe",
      "title": "Senior Full Stack Dev", // Optional
      "bio": "Experienced engineer bio...", // Optional
      "skills": "Next.js, TypeScript, Postgres" // Optional
    }
    ```
*   **Success Response** (Status `200 OK`):
    ```json
    {
      "message": "Profile updated successfully",
      "user": {
        "id": "u-uuid-string",
        "email": "seeker@example.com",
        "name": "Jane Doe",
        "role": "JOB_SEEKER",
        "profile": {
          "title": "Senior Full Stack Dev",
          "bio": "Experienced engineer bio...",
          "skills": "Next.js, TypeScript, Postgres"
          // other fields...
        }
      }
    }
    ```
*   **Error Responses**:
    - `403 Forbidden`: User is not a Job Seeker.
    - `500 Internal Server Error`: Profile transaction failed.

---

## Analytics Endpoints

### Retrieve Employer Workspace Analytics
*   **Method**: `GET`
*   **Path**: `/api/analytics/employer`
*   **Auth Required**: Yes (Employer role only)
*   **Request Body**: None
*   **Success Response** (Status `200 OK`):
    ```json
    {
      "summary": {
        "totalPostings": 5,
        "totalViews": 384,
        "totalApplications": 12
      },
      "pipeline": {
        "applied": 5,
        "shortlisted": 3,
        "rejected": 2,
        "hired": 2
      },
      "jobAnalytics": [
        {
          "id": "j-uuid-string",
          "title": "React Engineer",
          "location": "Remote",
          "jobType": "REMOTE",
          "views": 42,
          "companyName": "TechVibe Solutions",
          "applicantCount": 3,
          "createdAt": "2026-07-09T12:00:00.000Z"
        }
      ]
    }
    ```
*   **Error Responses**:
    - `403 Forbidden`: User is not an Employer.
    - `500 Internal Server Error`: Analytics compilation failed.
