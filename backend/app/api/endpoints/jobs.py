from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.job import JobRequisition, JobStatus
from app.schemas.job import JobCreate, JobUpdate, JobResponse
from app.models.user import User
from app.api.deps import get_current_active_admin

router = APIRouter()

@router.get("/public", response_model=List[JobResponse])
def get_public_jobs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    jobs = db.query(JobRequisition).filter(JobRequisition.status == JobStatus.OPEN).offset(skip).limit(limit).all()
    return jobs

@router.get("/public/{job_id}", response_model=JobResponse)
def get_public_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(JobRequisition).filter(JobRequisition.id == job_id, JobRequisition.status == JobStatus.OPEN).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.get("/admin", response_model=List[JobResponse])
def get_all_jobs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_admin)):
    jobs = db.query(JobRequisition).offset(skip).limit(limit).all()
    return jobs

@router.post("/admin", response_model=JobResponse)
def create_job(job_in: JobCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_admin)):
    job = JobRequisition(**job_in.model_dump())
    db.add(job)
    db.commit()
    db.refresh(job)
    return job

@router.put("/admin/{job_id}", response_model=JobResponse)
@router.patch("/admin/{job_id}", response_model=JobResponse)
def update_job(job_id: int, job_in: JobUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_admin)):
    job = db.query(JobRequisition).filter(JobRequisition.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    update_data = job_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(job, field, value)
        
    db.add(job)
    db.commit()
    db.refresh(job)
    return job
