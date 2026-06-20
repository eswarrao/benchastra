import smtplib
import random
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings


def generate_otp() -> str:
    return ''.join([str(random.randint(0, 9)) for _ in range(6)])


def _smtp_fully_configured() -> bool:
    return bool(
        settings.SMTP_HOST
        and settings.SMTP_PORT
        and settings.SMTP_USER
        and settings.SMTP_PASSWORD
    )


def send_otp_email(email: str, otp: str, purpose: str = "verification") -> bool:
    # Always print to console so developers can test without SMTP
    label = "Email Verification" if purpose == "verification" else "Password Reset"
    print(f"\n{'='*50}")
    print(f"  OTP [{label}]")
    print(f"  To   : {email}")
    print(f"  Code : {otp}")
    print(f"  (valid for 10 minutes)")
    print(f"{'='*50}\n")

    if not _smtp_fully_configured():
        return True

    try:
        subject = f"BenchAstra – Your {label} OTP"
        body = f"""\
<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;background:#f8fafc;padding:32px;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;
              padding:32px;border:1px solid #e2e8f0;">
    <h2 style="color:#1e293b;margin-top:0;">Your BenchAstra OTP</h2>
    <p style="color:#475569;">Use the code below to complete your {purpose}:</p>
    <div style="background:#f1f5f9;border-radius:12px;padding:24px;text-align:center;
                margin:24px 0;">
      <span style="font-size:36px;font-weight:700;letter-spacing:0.3em;color:#2563eb;">
        {otp}
      </span>
    </div>
    <p style="color:#64748b;font-size:14px;">
      This code expires in <strong>10 minutes</strong>.<br>
      If you did not request this, you can safely ignore this email.
    </p>
  </div>
</body>
</html>"""

        msg = MIMEMultipart("alternative")
        msg["From"] = f"BenchAstra <{settings.SMTP_USER}>"
        msg["To"] = email
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "html"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)

        print(f"  Email sent successfully to {email}")
        return True

    except Exception as e:
        print(f"  SMTP error (OTP still valid — use code above): {e}")
        return False
