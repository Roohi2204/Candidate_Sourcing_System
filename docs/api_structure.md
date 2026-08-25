# TalentBridge API Specification & Architecture

This document provides a comprehensive reference for the **TalentBridge RESTful API** backend built with **FastAPI**.

---

## 1. Overview & General Conventions

- **Base URL:** `http://localhost:8000/api`
- **Interactive Swagger UI:** `http://localhost:8000/docs`
- **OpenAPI JSON Spec:** `http://localhost:8000/api/openapi.json`
- **Content-Type:** `application/json` (except `/upload-resume` which uses `multipart/form-data`)
- **Authentication Scheme:** Bearer Token via HTTP Header:
  ```http
  Authorization: Bearer <JWT_ACCESS_TOKEN>
  ```

---

## 2. Authentication & User Endpoints (`/api/auth`)

### 2.1 Register Candidate
Creates a new candidate account. (Admin registration is disabled via the public API).

- **Method:** `POST`
- **Path:** `/api/auth/register`
- **Access:** Public

#### Request Body
```json
{
  "email": "candidate@example.com",
  "password": "Password@123",
  "mobile_number": "+91 9876543210"
}
```

#### Response (`200 OK`)
```json
{
  "id": 2,
  "email": "candidate@example.com",
  "role": "candidate",
  "mobile_number": "+91 9876543210",
  "is_active": true,
  "created_at": "2026-08-25T10:00:00Z"
}
```

---

### 2.2 User Login
Authenticates admin or candidate credentials and returns a signed JWT access token.

- **Method:** `POST`
- **Path:** `/api/auth/login`
- **Access:** Public

#### Request Body
```json
{
  "email": "admin@talentbridge.com",
  "password": "admin123"
}
```

#### Response (`200 OK`)
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "admin@talentbridge.com",
    "role": "admin",
    "is_active": true
  }
}
```

---

### 2.3 Current User Profile
Fetches profile data for the authenticated token.

- **Method:** `GET`
- **Path:** `/api/auth/me`
- **Access:** Authenticated (Candidate or Admin)

#### Response (`200 OK`)
```json
{
  "id": 2,
  "email": "candidate@example.com",
  "role": "candidate",
  "mobile_number": "+91 9876543210",
  "is_active": true
}
```

---

## 3. Job Requisitions Endpoints (`/api/jobs`)

### 3.1 List Public Open Jobs
Returns all published job requisitions.

- **Method:** `GET`
- **Path:** `/api/jobs/public`
- **Access:** Public

#### Response (`200 OK`)
```json
[
  {
    "id": 1,
    "job_title": "Senior Backend Engineer",
    "department": "Engineering",
    "location": "Hyderabad, TS",
    "employment_type": "Full-time",
    "experience_range": "3-6 years",
    "salary_budget": "₹18,00,000 - ₹24,00,000",
    "description": "We are seeking an experienced Backend Engineer to lead API services...",
    "status": "open",
    "hiring_deadline": "2026-09-30T00:00:00Z",
    "created_at": "2026-08-25T08:00:00Z"
  }
]
```

---

### 3.2 Get Public Job Detail
Fetches full details for a single job requisition.

- **Method:** `GET`
- **Path:** `/api/jobs/public/{id}`
- **Access:** Public

---

### 3.3 Create Job Requisition (Admin)
Creates a new requisition as open or draft.

- **Method:** `POST`
- **Path:** `/api/jobs/admin`
- **Access:** Admin Only

#### Request Body
```json
{
  "job_title": "Lead Product Designer",
  "department": "Design",
  "location": "Remote",
  "employment_type": "Full-time",
  "experience_range": "5+ years",
  "salary_budget": "$130,000 - $160,000",
  "description": "Lead UX research and interface design systems...",
  "status": "open"
}
```

---

### 3.4 Update Job Requisition (Admin)
Updates requisition metadata or status (`open`, `closed`, `draft`).

- **Method:** `PATCH`
- **Path:** `/api/jobs/admin/{id}`
- **Access:** Admin Only

---

## 4. Application Endpoints (`/api/applications`)

### 4.1 Upload Resume File
Uploads candidate resume (PDF, DOC, DOCX) to backend static storage (`/uploads`).

- **Method:** `POST`
- **Path:** `/api/applications/upload-resume`
- **Content-Type:** `multipart/form-data`
- **Access:** Public / Candidate

#### Form Data
- `file`: `<Binary File>` (e.g. `Resume_JohnDoe.pdf`)

#### Response (`200 OK`)
```json
{
  "resume_url": "http://localhost:8000/uploads/Resume_JohnDoe.pdf",
  "filename": "Resume_JohnDoe.pdf"
}
```

---

### 4.2 Initialize Application Draft
Initializes or fetches an existing draft application for a candidate.

- **Method:** `POST`
- **Path:** `/api/applications/draft`
- **Access:** Candidate Only

#### Request Body
```json
{
  "job_id": 1,
  "email": "candidate@example.com"
}
```

---

### 4.3 Auto-Save Draft Progress
Patches wizard form progress across steps 1 through 4.

- **Method:** `PATCH`
- **Path:** `/api/applications/draft/{app_id}`
- **Access:** Candidate Only

#### Request Body
```json
{
  "first_name": "Roohi",
  "last_name": "Rehana",
  "phone": "Hyderabad, TS | Notice: 15 days",
  "education_details": "[{\"level\":\"Bachelor's\",\"degree\":\"B.Tech\",\"institution\":\"JNTU\",\"year\":\"2024\"}]",
  "is_fresher": false,
  "experience_details": "[{\"company\":\"Tech Corp\",\"designation\":\"Software Engineer\",\"startDate\":\"2024-01-01\"}]",
  "total_years_experience": 2,
  "resume_url": "http://localhost:8000/uploads/Resume_Roohi.pdf"
}
```

---

### 4.4 Finalize & Submit Application
Finalizes application, marks status as `new`, triggers in-app notification, and dispatches SMTP confirmation email.

- **Method:** `POST`
- **Path:** `/api/applications/{app_id}/submit`
- **Access:** Candidate Only

---

### 4.5 Get Candidate's Applications
Retrieves all applications submitted by the logged-in candidate with eager-loaded role details.

- **Method:** `GET`
- **Path:** `/api/applications/my-applications`
- **Access:** Candidate Only

#### Response (`200 OK`)
```json
[
  {
    "id": 1,
    "candidate_id": 2,
    "job_id": 1,
    "status": "new",
    "resume_url": "http://localhost:8000/uploads/Resume_Roohi.pdf",
    "submitted_at": "2026-08-25T09:30:00Z",
    "created_at": "2026-08-25T09:15:00Z",
    "updated_at": "2026-08-25T09:30:00Z",
    "job": {
      "id": 1,
      "job_title": "Senior Backend Engineer",
      "department": "Engineering",
      "location": "Hyderabad, TS"
    }
  }
]
```

---

### 4.6 List All Applications (Admin Triage)
Retrieves all candidate applications with optional filtering by `job_id`.

- **Method:** `GET`
- **Path:** `/api/applications/admin`
- **Query Params:** `job_id` (optional), `skip`, `limit`
- **Access:** Admin Only

---

### 4.7 Update Application Status (Admin)
Updates application state in the hiring pipeline.

- **Method:** `PATCH`
- **Path:** `/api/applications/admin/{app_id}/status`
- **Access:** Admin Only
- **Status Values:** `new` | `reviewed` | `shortlisted` | `rejected`

---

## 5. Notifications Endpoints (`/api/notifications`)

### 5.1 Get In-App Notification Feed
- **Method:** `GET`
- **Path:** `/api/notifications/`
- **Access:** Admin Only

### 5.2 Mark Single Notification Read
- **Method:** `PATCH`
- **Path:** `/api/notifications/{id}/read`
- **Access:** Admin Only

### 5.3 Mark All Read
- **Method:** `POST`
- **Path:** `/api/notifications/mark-all-read`
- **Access:** Admin Only

---

## 6. HTTP Status Code Reference

| Code | Meaning | Usage Scenario |
|---|---|---|
| `200 OK` | Success | Request succeeded and data returned |
| `201 Created` | Created | Resource successfully created |
| `400 Bad Request` | Validation Error | Missing mandatory field or invalid parameters |
| `401 Unauthorized` | Unauthenticated | Missing or expired JWT access token |
| `403 Forbidden` | Access Denied | Insufficient role permissions (e.g. Candidate calling Admin route) |
| `404 Not Found` | Not Found | Requisition or application ID does not exist |
| `500 Internal Error` | Server Error | Unhandled backend exception |
