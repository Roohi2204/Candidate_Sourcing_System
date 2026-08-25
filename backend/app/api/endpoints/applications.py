from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.database import get_db
from app.models.application import Application, ApplicationStatus
from app.models.job import JobRequisition
from app.schemas.application import ApplicationCreate, ApplicationUpdate, ApplicationResponse
from app.models.user import User
from app.api.deps import get_current_active_user, get_current_active_admin

import os
import shutil
from fastapi import UploadFile, File

router = APIRouter()

@router.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    uploads_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "uploads")
    uploads_dir = os.path.normpath(uploads_dir)
    os.makedirs(uploads_dir, exist_ok=True)
    
    file_path = os.path.join(uploads_dir, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    file_url = f"http://localhost:8000/uploads/{file.filename}"
    return {"resume_url": file_url, "filename": file.filename}

@router.post("/draft", response_model=ApplicationResponse)
def create_application_draft(app_in: ApplicationCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    # Check if job exists
    job = db.query(JobRequisition).filter(JobRequisition.id == app_in.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    # Check if already applied/draft exists
    existing_app = db.query(Application).filter(
        Application.candidate_id == current_user.id,
        Application.job_id == app_in.job_id
    ).first()
    if existing_app:
        return existing_app
        
    application = Application(
        candidate_id=current_user.id,
        **app_in.model_dump()
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    return application

@router.patch("/draft/{app_id}", response_model=ApplicationResponse)
def update_application_draft(app_id: int, app_in: ApplicationUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    application = db.query(Application).filter(
        Application.id == app_id, 
        Application.candidate_id == current_user.id
    ).first()
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    update_data = app_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(application, field, value)
        
    db.add(application)
    db.commit()
    db.refresh(application)
    return application

from app.models.notification import Notification
from app.services.email import send_application_confirmation_email

@router.post("/{app_id}/submit", response_model=ApplicationResponse)
async def submit_application(app_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    application = db.query(Application).filter(
        Application.id == app_id, 
        Application.candidate_id == current_user.id
    ).first()
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
        
    if not application.resume_url:
        raise HTTPException(status_code=400, detail="Resume is required for submission")
        
    application.status = ApplicationStatus.NEW
    application.submitted_at = datetime.utcnow()
    
    # Create in-app admin notification
    candidate_name = f"{application.first_name or ''} {application.last_name or ''}".strip() or current_user.email
    job_title = application.job.job_title if application.job else f"Job #{application.job_id}"
    
    notif = Notification(
        application_id=application.id,
        title="New Candidate Application",
        message=f"{candidate_name} submitted an application for {job_title}."
    )
    db.add(notif)
    db.add(application)
    db.commit()
    db.refresh(application)

    # Async SMTP dispatch
    await send_application_confirmation_email(
        to_email=application.email or current_user.email,
        candidate_name=candidate_name,
        job_title=job_title,
        app_id=application.id
    )
    
    return application


from sqlalchemy.orm import joinedload

@router.get("/my-applications", response_model=List[ApplicationResponse])
def get_my_applications(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return db.query(Application).options(joinedload(Application.job)).filter(Application.candidate_id == current_user.id).order_by(Application.id.desc()).all()

@router.get("/admin", response_model=List[ApplicationResponse])
def get_all_applications(job_id: int = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_admin)):
    query = db.query(Application).options(joinedload(Application.job))
    if job_id:
        query = query.filter(Application.job_id == job_id)
    return query.order_by(Application.id.desc()).offset(skip).limit(limit).all()

@router.patch("/admin/{app_id}/status", response_model=ApplicationResponse)
def update_application_status(app_id: int, status: ApplicationStatus, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_admin)):
    application = db.query(Application).filter(Application.id == app_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
        
    application.status = status
    db.add(application)
    db.commit()
    db.refresh(application)
    return application
