from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum, Float
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.core.database import Base

class JobStatus(str, enum.Enum):
    OPEN = "open"
    CLOSED = "closed"
    DRAFT = "draft"

class JobRequisition(Base):
    __tablename__ = "job_requisitions"

    id = Column(Integer, primary_key=True, index=True)
    job_title = Column(String, index=True, nullable=False)
    department = Column(String, index=True, nullable=False)
    location = Column(String, nullable=False)
    employment_type = Column(String, nullable=False)
    experience_range = Column(String, nullable=False)
    salary_budget = Column(String, nullable=True)
    description = Column(Text, nullable=False)
    status = Column(Enum(JobStatus), default=JobStatus.OPEN)
    hiring_deadline = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    applications = relationship("Application", back_populates="job")
