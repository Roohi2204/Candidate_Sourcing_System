from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.job import JobStatus

class JobBase(BaseModel):
    job_title: str
    department: str
    location: str
    employment_type: str
    experience_range: str
    salary_budget: Optional[str] = None
    description: str
    status: JobStatus = JobStatus.OPEN
    hiring_deadline: Optional[datetime] = None

class JobCreate(JobBase):
    pass

class JobUpdate(JobBase):
    job_title: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    employment_type: Optional[str] = None
    experience_range: Optional[str] = None
    description: Optional[str] = None
    status: Optional[JobStatus] = None

class JobResponse(JobBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
