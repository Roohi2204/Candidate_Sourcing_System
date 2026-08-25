from sqlalchemy import Column, Integer, String, ForeignKey, Enum, DateTime, Boolean, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.core.database import Base

class ApplicationStatus(str, enum.Enum):
    NEW = "new"
    REVIEWED = "reviewed"
    SHORTLISTED = "shortlisted"
    REJECTED = "rejected"

class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("job_requisitions.id"), nullable=False)
    
    # Step 1: Bio Data
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    
    # Step 2: Education (Stored as JSON string for simplicity, or could be a related table)
    education_details = Column(Text, nullable=True)
    
    # Step 3: Experience
    is_fresher = Column(Boolean, default=False)
    experience_details = Column(Text, nullable=True)
    total_years_experience = Column(Integer, default=0)
    
    # Step 4: Submission
    resume_url = Column(String, nullable=True)
    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.NEW)
    submitted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    candidate = relationship("User", backref="applications")
    job = relationship("JobRequisition", back_populates="applications")
