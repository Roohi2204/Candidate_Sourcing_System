import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models import User, JobRequisition, JobStatus, Application

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        print("--- Checking & Seeding Database ---")
        
        # 1. Check or Create Admin
        admin = db.query(User).filter(User.email == "admin@talentbridge.com").first()
        if not admin:
            admin = User(
                email="admin@talentbridge.com",
                hashed_password=get_password_hash("admin123"),
                role="admin",
                mobile_number="+1234567890",
                is_active=True
            )
            db.add(admin)
            db.commit()
            print("[OK] Created default Admin: admin@talentbridge.com (Password: admin123)")
        else:
            print(f"[OK] Admin already exists: {admin.email} (Role: {admin.role})")

        # 2. Check or Create Sample Jobs
        existing_jobs = db.query(JobRequisition).count()
        if existing_jobs == 0:
            sample_jobs = [
                JobRequisition(
                    job_title="Senior Full Stack Engineer",
                    department="Engineering",
                    location="Remote / San Francisco",
                    employment_type="Full-time",
                    experience_range="4-7 years",
                    salary_budget="$140,000 - $170,000",
                    description="We are looking for an experienced Full Stack Engineer to lead our core product initiatives using FastAPI and Next.js.",
                    status=JobStatus.OPEN
                ),
                JobRequisition(
                    job_title="Product Designer (UI/UX)",
                    department="Design",
                    location="New York, NY",
                    employment_type="Full-time",
                    experience_range="2-5 years",
                    salary_budget="$110,000 - $135,000",
                    description="Shape the user experience across all talent sourcing flows. Strong Figma and prototyping skills required.",
                    status=JobStatus.OPEN
                ),
                JobRequisition(
                    job_title="DevOps & Cloud Engineer",
                    department="Infrastructure",
                    location="Austin, TX",
                    employment_type="Full-time",
                    experience_range="3-6 years",
                    salary_budget="$130,000 - $160,000",
                    description="Build and maintain CI/CD pipelines, container orchestration, and multi-region cloud infrastructure.",
                    status=JobStatus.OPEN
                )
            ]
            db.add_all(sample_jobs)
            db.commit()
            print("[OK] Seeded 3 sample job requisitions.")
        else:
            print(f"[OK] {existing_jobs} job requisition(s) already exist.")

        # 3. Print Summary of Current DB contents
        print("\n--- Current Users in DB ---")
        users = db.query(User).all()
        for u in users:
            print(f"  [ID: {u.id}] {u.email} | Role: {u.role} | Active: {u.is_active}")

        print("\n--- Current Jobs in DB ---")
        jobs = db.query(JobRequisition).all()
        for j in jobs:
            print(f"  [ID: {j.id}] {j.job_title} ({j.department}) - Status: {j.status}")

    finally:
        db.close()

if __name__ == "__main__":
    seed()
