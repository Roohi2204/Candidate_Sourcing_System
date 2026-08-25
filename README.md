# TalentBridge — Candidate Sourcing & Application Tracking System (ATS)

A modern, full-stack recruitment and candidate sourcing platform built to streamline the hiring process from job discovery to application evaluation. Built with **FastAPI**, **Next.js 16 (App Router)**, and **PostgreSQL**.

---

## Table of Contents
- [1. Project Overview](#1-project-overview)
- [2. Problem Understanding](#2-problem-understanding)
- [3. Features Implemented](#3-features-implemented)
- [4. Technology Stack](#4-technology-stack)
- [5. System Architecture & Approach](#5-system-architecture--approach)
- [6. Database Design & Schema](#6-database-design--schema)
- [7. API Documentation & Overview](#7-api-documentation--overview)
- [8. Environment Variables & Configuration](#8-environment-variables--configuration)
- [9. Setup & Local Installation](#9-setup--local-installation)
- [10. How to Run the Project Locally](#10-how-to-run-the-project-locally)
- [11. Test Credentials](#11-test-credentials)
- [12. Testing Approach & Verification](#12-testing-approach--verification)
- [13. Known Limitations](#13-known-limitations)
- [14. Future Improvements](#14-future-improvements)

---

## 1. Project Overview

**TalentBridge** is an enterprise-grade Candidate Sourcing and Applicant Tracking System (ATS) designed to bridge the gap between job seekers and hiring teams.

- **For Candidates:** An intuitive, responsive career portal to discover job openings, share job listings across social channels, complete multi-step job applications with resume validation, and track their application progress in real-time.
- **For Admins & Recruiters:** A powerful administrative dashboard to post and manage job requisitions, review submitted candidate profiles, inspect uploaded resumes, triage applications (Review, Shortlist, Reject), and monitor real-time notification alerts.

---

## 2. Problem Understanding

Traditional hiring workflows often suffer from:
1. **Friction in Job Discovery & Sharing:** Candidates lack direct ways to share positions across professional and social platforms (LinkedIn, WhatsApp, X/Twitter, Email).
2. **Disjointed Application Submissions:** Form errors, lack of validation, or missing resumes cause incomplete applications.
3. **Role Confusion & Security Vulnerabilities:** Ambiguity between public candidate registration and administrative privileges often results in unauthorized administrative role creation.
4. **Lack of Visibility:** Candidates are left in the dark after applying, with no status updates or email confirmations.
5. **Slow Recruiter Triage:** Recruiters need immediate notifications, organized candidate metadata (bio, education, experience, resume link), and one-click status transitions.

TalentBridge resolves these problems through strict role-based access control (RBAC), multi-step validated application flows, real-time SMTP confirmation emails, and centralized admin triage dashboards.

---

## 3. Features Implemented

### Candidate Flow
- **Public Careers Portal:** Clean UI listing active job requisitions with department, location, experience range, and employment type.
- **Job Details & Social Sharing:**
  - Full job description and requirements breakdown.
  - Interactive **Share Position Modal** with 1-click **Direct Link Copy**, **WhatsApp**, **LinkedIn**, **X / Twitter**, **Email**, and native device share targets.
- **Role-Restricted Authentication:**
  - Candidate-only registration (prevents unauthorized admin account creation).
  - Secure JWT authentication with session persistence.
- **Multi-Step Application Wizard:**
  - **Step 1: Personal Bio-Data:** First Name `*`, Last Name `*`, Gender `*`, Date of Birth `*` (with age filter: minimum 18 years old), Location `*`, Notice Period `*`, Current Address `*`.
  - **Step 2: Educational Qualifications:** Dynamic qualification list (Level `*`, Degree `*`, Institution `*`, Passing Year `*`, CGPA/Grade).
  - **Step 3: Work Experience:** Dynamic experience list (Company `*`, Designation `*`, Start Date `*`, End Date, Currently Working Here toggle) or 1-click "Fresher" option.
  - **Step 4: Resume & Final Review:** Mandatory resume upload (PDF/DOC/DOCX file upload or cloud link), Application Review Summary box, and consent declarations `*`.
- **Application Confirmation Screen:** Instant submission confirmation displaying Candidate Name, Application ID (`#APP-XXXXX`), and role details.
- **My Applications Dashboard:**
  - Displays submitted applications prominently with **Role/Job Title**, Department, Location, Application ID, Requisition ID, Submission Date, Live Status Badge, and direct link to view the submitted resume.

### Admin Flow
- **Built-in Admin Access:** Built-in administrator account protected by bcrypt encryption.
- **Job Requisitions Management:** Create, update, publish, draft, and close job postings.
- **Candidate Application Triage:**
  - View all candidate submissions per requisition or across all jobs.
  - Inspect candidate details: Bio, Education history, Experience breakdown, and one-click access to uploaded resumes.
  - Update application statuses: `Submitted (New)`, `Under Review`, `Shortlisted`, `Not Selected (Rejected)`.
- **Real-Time In-App Notifications:** Admin alerts triggered whenever a new candidate submits an application.
- **Admin Settings & Profile:** Password reset, profile overview, and system connectivity tabs.

### System & Communication
- **Automated SMTP Email Dispatch:** Asynchronous email dispatch delivering confirmation emails to candidates with their application ID upon submission.
- **Static File Serving:** Resumes uploaded by candidates are stored on the server filesystem (`/uploads`) and served statically for previewing and downloading.

---

## 4. Technology Stack

### Frontend
- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (Modern Glassmorphism & Slate/Indigo Palette)
- **HTTP Client:** Axios with JWT Interceptors
- **State Management:** React Hooks (`useState`, `useEffect`, `useContext`)

### Backend
- **Framework:** FastAPI (Python 3.10+)
- **ORM:** SQLAlchemy 2.0
- **Database:** PostgreSQL (with psycopg2 / pg8000 driver)
- **Data Validation & Schemas:** Pydantic v2 / Pydantic Settings
- **Authentication & Security:** JWT (JSON Web Tokens via PyJWT/python-jose), Passlib (bcrypt password hashing)
- **Static Asset Serving:** FastAPI `StaticFiles`
- **Email Service:** Python `smtplib` / `email.mime` (Async SMTP dispatch via Gmail SMTP)

---

## 5. System Architecture & Approach

TalentBridge uses a decoupled client-server architecture:

```mermaid
graph TD
    subgraph Frontend ["Next.js App Router Client"]
        CareersPage["Public Careers Page (/)"]
        JobDetail["Job Detail & Share (/jobs/:id)"]
        AuthModule["Auth: Candidate Login / Register"]
        Wizard["4-Step Application Wizard (/apply/:jobId)"]
        MyApps["My Applications (/my-applications)"]
        AdminDashboard["Admin Dashboard (/admin/dashboard)"]
    end

    subgraph Backend ["FastAPI REST API"]
        AuthRouter["/api/auth - Login / Register / Me"]
        JobsRouter["/api/jobs - CRUD Requisitions"]
        AppsRouter["/api/applications - Draft / Submit / Upload"]
        NotifsRouter["/api/notifications - In-App Alerts"]
        StaticMount["/uploads - Resume File Serving"]
        EmailService["Async SMTP Dispatcher"]
    end

    subgraph Storage ["PostgreSQL Database"]
        UsersTable[("users")]
        JobsTable[("job_requisitions")]
        AppsTable[("applications")]
        NotifsTable[("notifications")]
    end

    CareersPage --> JobsRouter
    JobDetail --> JobsRouter
    AuthModule --> AuthRouter
    Wizard --> AppsRouter
    Wizard --> StaticMount
    AppsRouter --> EmailService
    MyApps --> AppsRouter
    AdminDashboard --> JobsRouter
    AdminDashboard --> AppsRouter
    AdminDashboard --> NotifsRouter

    AuthRouter --> UsersTable
    JobsRouter --> JobsTable
    AppsRouter --> AppsTable
    NotifsRouter --> NotifsTable
```

---

## 6. Database Design & Schema

The PostgreSQL database (`talentbridge`) consists of four primary relational tables:

```mermaid
erDiagram
    USERS ||--o{ APPLICATIONS : "applies through"
    JOB_REQUISITIONS ||--o{ APPLICATIONS : "receives"
    APPLICATIONS ||--o{ NOTIFICATIONS : "triggers"

    USERS {
        int id PK
        string email UK
        string hashed_password
        string role "admin | candidate"
        string mobile_number
        boolean is_active
        datetime created_at
    }

    JOB_REQUISITIONS {
        int id PK
        string job_title
        string department
        string location
        string employment_type
        string experience_range
        string salary_budget
        text description
        enum status "open | closed | draft"
        datetime hiring_deadline
        datetime created_at
        datetime updated_at
    }

    APPLICATIONS {
        int id PK
        int candidate_id FK
        int job_id FK
        string first_name
        string last_name
        string email
        string phone
        text education_details
        boolean is_fresher
        text experience_details
        int total_years_experience
        string resume_url
        enum status "new | reviewed | shortlisted | rejected"
        datetime submitted_at
        datetime created_at
        datetime updated_at
    }

    NOTIFICATIONS {
        int id PK
        int application_id FK
        string title
        text message
        boolean is_read
        datetime created_at
    }
```

---

## 7. API Documentation & Overview

Interactive Swagger documentation is automatically generated by FastAPI at:
`http://localhost:8000/docs` (or OpenAPI JSON at `http://localhost:8000/api/openapi.json`).

### Key Endpoints Summary

| Module | Method | Endpoint | Description | Access |
|---|---|---|---|---|
| **Auth** | `POST` | `/api/auth/register` | Register new Candidate | Public |
| **Auth** | `POST` | `/api/auth/login` | Login (returns JWT Access Token) | Public |
| **Auth** | `GET` | `/api/auth/me` | Get current authenticated user profile | Authenticated |
| **Jobs** | `GET` | `/api/jobs/public` | List all open job requisitions | Public |
| **Jobs** | `GET` | `/api/jobs/public/{id}` | Get single public job detail | Public |
| **Jobs** | `POST` | `/api/jobs/admin` | Create new job requisition | Admin Only |
| **Jobs** | `PATCH` | `/api/jobs/admin/{id}` | Update job requisition details/status | Admin Only |
| **Applications** | `POST` | `/api/applications/upload-resume` | Upload PDF/DOC file to server `/uploads` | Public / Auth |
| **Applications** | `POST` | `/api/applications/draft` | Create or fetch existing application draft | Candidate |
| **Applications** | `PATCH` | `/api/applications/draft/{id}` | Auto-save draft application data | Candidate |
| **Applications** | `POST` | `/api/applications/{id}/submit` | Finalize & submit application + send email | Candidate |
| **Applications** | `GET` | `/api/applications/my-applications` | Get all submissions for logged-in candidate | Candidate |
| **Applications** | `GET` | `/api/applications/admin` | Get all candidate applications | Admin Only |
| **Applications** | `PATCH` | `/api/applications/admin/{id}/status` | Update candidate status (review/shortlist/reject) | Admin Only |
| **Notifications** | `GET` | `/api/notifications/` | Get admin notification feed | Admin Only |
| **Notifications** | `PATCH` | `/api/notifications/{id}/read` | Mark notification as read | Admin Only |

---

## 8. Environment Variables & Configuration

### Backend (`backend/app/core/config.py` & `.env`)
```ini
PROJECT_NAME="TalentBridge System"
SQLALCHEMY_DATABASE_URI="postgresql://postgres:Roohi%402204@localhost:5432/talentbridge"
SECRET_KEY="supersecretkey"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# SMTP Email Dispatch
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="talentbridge.careers1@gmail.com"
SMTP_PASSWORD="pdyndrfmnpuxtmzr"
SENDER_EMAIL="TalentBridge Careers <talentbridge.careers1@gmail.com>"
```

### Frontend (`frontend/.env.local`)
```ini
NEXT_PUBLIC_API_URL="http://localhost:8000/api"
```

---

## 9. Setup & Local Installation

### Prerequisites
- **Node.js** (v18.x or higher)
- **Python** (v3.10 or higher)
- **PostgreSQL** (v14+ installed and running locally on port `5432`)
- **pgAdmin** or PostgreSQL CLI (`psql`)

### Step 1: Clone or Navigate to the Repository
```bash
cd c:\candidate_sourcing
```

### Step 2: PostgreSQL Database Creation
Ensure PostgreSQL is running and create the `talentbridge` database:
```sql
CREATE DATABASE talentbridge;
```

### Step 3: Backend Setup & Dependency Installation
```bash
cd c:\candidate_sourcing\backend

# Create virtual environment (optional but recommended)
python -m venv venv
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Step 4: Seed Database (Admin & Sample Jobs)
Run the seed script to create all database tables, seed the built-in admin account, and populate sample job requisitions:
```bash
python seed_data.py
```

### Step 5: Frontend Setup & Dependency Installation
```bash
cd c:\candidate_sourcing\frontend

# Install npm dependencies
npm install
```

---

## 10. How to Run the Project Locally

### 1. Start the Backend Server
```bash
cd c:\candidate_sourcing\backend
python -m uvicorn app.main:app --reload --port 8000
```
- Backend API runs at: `http://localhost:8000`
- Swagger UI available at: `http://localhost:8000/docs`

### 2. Start the Frontend Application
```bash
cd c:\candidate_sourcing\frontend
npm run dev
```
- Frontend application runs at: `http://localhost:3000`

---

## 11. Test Credentials

### Built-in Admin Account
- **Role:** Administrator (cannot register via UI, built-in only)
- **Email:** `admin@talentbridge.com`
- **Password:** `admin123`
- **Dashboard URL:** `http://localhost:3000/admin/dashboard`

### Sample Candidate Account
- **Role:** Candidate
- **Email:** `roohi2204@gmail.com` *(or create any new candidate account via the Register page)*
- **Password:** `Roohi@2204`
- **Portal URL:** `http://localhost:3000`

---

## 12. Testing Approach & Verification

1. **Candidate Job Discovery & Social Sharing:**
   - Navigate to `http://localhost:3000/` and click any job.
   - Click **Share Position** and verify that WhatsApp, LinkedIn, X/Twitter, Email, and Copy Link modal work seamlessly.
2. **Authentication & RBAC:**
   - Verify that candidates can register and login.
   - Verify that Admin cannot apply for jobs (the Apply button displays *Admin View* and is disabled).
3. **Application Wizard & Validation:**
   - Verify Step 1 Date of Birth filter blocks applicants under 18 years old.
   - Verify all required fields marked with `*` block progress if empty.
   - Verify dynamic addition/removal of Education and Experience items.
   - Verify mandatory resume upload prevents submission if omitted.
   - Verify Application Review Summary in Step 4 displays all entered data accurately.
4. **Email Confirmation Verification:**
   - Submit an application and confirm receipt of the automated confirmation email sent to the candidate's email address.
5. **Admin Triage & Real-Time Alerts:**
   - Log into `admin@talentbridge.com`.
   - Verify incoming notifications in the top bar.
   - Review submitted applications, inspect resume links, and change candidate statuses.

---

## 13. Known Limitations

1. **Local File Storage:** Resumes are currently stored on the local server filesystem (`/uploads`). In multi-instance or serverless production deployments, an object store (e.g., AWS S3 or Google Cloud Storage) should be used.
2. **Email Provider Throttling:** The SMTP service uses standard Gmail SMTP credentials, which is suitable for development and small-scale testing but has daily rate limits for enterprise production volume.
3. **Offline Document Parsing:** Resumes are stored and served as files/links without automated text extraction or AI resume parsing.

---

## 14. Future Improvements

- [ ] **Cloud Storage Integration:** Connect AWS S3 / Cloudinary for cloud-backed resume asset storage.
- [ ] **AI-Powered Resume Parsing & Matching:** Integrate Gemini API / NLP models to automatically extract candidate skills and calculate job-fit scores.
- [ ] **Interview Scheduling Module:** Add calendar integration (Google Calendar / Outlook) to schedule candidate screening rounds.
- [ ] **Candidate Assessment Tests:** Add customizable pre-screening quizzes and coding assessments.
- [ ] **Two-Factor Authentication (2FA):** Add TOTP / SMS 2FA for recruiter and administrative accounts.

---

### Project Repository & Development Team
- **Project:** TalentBridge Candidate Sourcing System
- **Repository Path:** `c:\candidate_sourcing`
- **License:** Proprietary & Confidential
