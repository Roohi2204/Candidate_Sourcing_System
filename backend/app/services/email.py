import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import asyncio

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER", "talentbridge.careers1@gmail.com")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "pdyndrfmnpuxtmzr")
SENDER_EMAIL = os.getenv("SENDER_EMAIL", "TalentBridge Careers <talentbridge.careers1@gmail.com>")

def send_email_sync(to_email: str, subject: str, body_html: str):
    if not SMTP_USER or not SMTP_PASSWORD:
        print(f"\n[MOCK SMTP DISPATCH] To: {to_email} | Subject: {subject}\nBody: {body_html[:150]}...\n")
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = SENDER_EMAIL
        msg["To"] = to_email
        msg.attach(MIMEText(body_html, "html"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SENDER_EMAIL, to_email, msg.as_string())
        print(f"[SMTP SUCCESS] Email sent to {to_email}")
        return True
    except Exception as e:
        print(f"[SMTP ERROR] Failed to send email to {to_email}: {e}")
        return False

async def send_application_confirmation_email(to_email: str, candidate_name: str, job_title: str, app_id: int):
    subject = f"Application Received: {job_title} (#{app_id}) - TalentBridge"
    body_html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #2563eb;">TalentBridge Application Confirmation</h2>
        <p>Dear <strong>{candidate_name}</strong>,</p>
        <p>Thank you for applying for the <strong>{job_title}</strong> position at TalentBridge.</p>
        <p>Your application ID is <strong>APP-{app_id:05d}</strong>.</p>
        <p>Our recruitment team is currently reviewing your profile and will update you regarding the next steps.</p>
        <br/>
        <p style="font-size: 12px; color: #64748b;">Best regards,<br/>Talent Acquisition Team</p>
    </div>
    """
    await asyncio.to_thread(send_email_sync, to_email, subject, body_html)
