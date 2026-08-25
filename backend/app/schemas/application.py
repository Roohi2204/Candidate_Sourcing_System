from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.application import ApplicationStatus

class JobInApplication(BaseModel):
    id: int
    job_title: str
    department: str
    location: str
    employment_type: Optional[str] = None
    experience_range: Optional[str] = None

    class Config:
        from_attributes = True

class ApplicationBase(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    education_details: Optional[str] = None
    is_fresher: bool = False
    experience_details: Optional[str] = None
    total_years_experience: int = 0
    resume_url: Optional[str] = None
    status: ApplicationStatus = ApplicationStatus.NEW

class ApplicationCreate(ApplicationBase):
    job_id: int

class ApplicationUpdate(ApplicationBase):
    status: Optional[ApplicationStatus] = None

class ApplicationResponse(ApplicationBase):
    id: int
    candidate_id: int
    job_id: int
    submitted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    job: Optional[JobInApplication] = None

    class Config:
        from_attributes = True
