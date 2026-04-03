"""
VibeMatch OTP Service
Handles OTP generation, storage, and delivery via SMS (Twilio) and Email (SMTP).
"""

import random
import time
import smtplib
import os
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# --- In-memory OTP Store (keyed by identifier, value = {code, expires_at}) ---
_otp_store: dict[str, dict] = {}

OTP_EXPIRY_SECONDS = 300  # 5 minutes


def generate_otp() -> str:
    """Generate a random 4-digit OTP."""
    return str(random.randint(1000, 9999))


def store_otp(identifier: str, code: str):
    """Store OTP with expiry timestamp."""
    _otp_store[identifier] = {
        "code": code,
        "expires_at": time.time() + OTP_EXPIRY_SECONDS,
    }
    logger.info(f"[OTP STORED] {identifier} -> {code} (expires in {OTP_EXPIRY_SECONDS}s)")


def verify_stored_otp(identifier: str, code: str) -> bool:
    """Verify an OTP code against the store. Returns True if valid."""
    entry = _otp_store.get(identifier)
    if not entry:
        return False
    if time.time() > entry["expires_at"]:
        del _otp_store[identifier]
        return False
    if entry["code"] != code:
        return False
    # OTP is valid — consume it
    del _otp_store[identifier]
    return True


def send_otp_email(email: str, code: str) -> bool:
    """
    Send OTP via Email using SMTP.
    Requires these env vars:
      SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM_EMAIL
    Falls back to console logging if not configured.
    """
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")
    from_email = os.getenv("SMTP_FROM_EMAIL", smtp_user)

    if not all([smtp_host, smtp_user, smtp_password]):
        logger.warning(f"[EMAIL OTP FALLBACK] SMTP not configured. OTP for {email}: {code}")
        print(f"\n{'='*50}")
        print(f"📧 EMAIL OTP for {email}: {code}")
        print(f"{'='*50}\n")
        return True  # Don't block the flow

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"VibeMatch - Your Verification Code: {code}"
        msg["From"] = from_email
        msg["To"] = email

        html = f"""
        <html>
        <body style="font-family: -apple-system, sans-serif; background: #F4F7FB; padding: 40px;">
            <div style="max-width: 400px; margin: auto; background: white; border-radius: 24px; padding: 40px; text-align: center;">
                <h1 style="color: #0F172A; font-size: 28px;">🎵 VibeMatch</h1>
                <p style="color: #64748B; font-size: 16px;">Your verification code is:</p>
                <div style="background: #0055FF; color: white; font-size: 36px; font-weight: 900; padding: 20px; border-radius: 16px; letter-spacing: 8px; margin: 20px 0;">
                    {code}
                </div>
                <p style="color: #94A3B8; font-size: 14px;">This code expires in 5 minutes.</p>
            </div>
        </body>
        </html>
        """
        msg.attach(MIMEText(html, "html"))

        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.sendmail(from_email, email, msg.as_string())

        logger.info(f"[EMAIL OTP SENT] {email}")
        return True
    except Exception as e:
        logger.error(f"[EMAIL OTP FAILED] {email}: {e}")
        print(f"\n📧 EMAIL OTP FALLBACK for {email}: {code}\n")
        return True  # Don't block the flow


def send_otp_sms(phone: str, code: str) -> bool:
    """
    Send OTP via SMS using Twilio.
    Requires these env vars:
      TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
    Falls back to console logging if not configured.
    """
    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    twilio_phone = os.getenv("TWILIO_PHONE_NUMBER")

    if not all([account_sid, auth_token, twilio_phone]):
        logger.warning(f"[SMS OTP FALLBACK] Twilio not configured. OTP for {phone}: {code}")
        print(f"\n{'='*50}")
        print(f"📱 SMS OTP for {phone}: {code}")
        print(f"{'='*50}\n")
        return True  # Don't block the flow

    try:
        from twilio.rest import Client
        client = Client(account_sid, auth_token)

        # Ensure phone has country code
        to_phone = phone if phone.startswith("+") else f"+91{phone}"

        message = client.messages.create(
            body=f"Your VibeMatch verification code is: {code}. It expires in 5 minutes.",
            from_=twilio_phone,
            to=to_phone,
        )
        logger.info(f"[SMS OTP SENT] {phone} -> SID: {message.sid}")
        return True
    except Exception as e:
        logger.error(f"[SMS OTP FAILED] {phone}: {e}")
        print(f"\n📱 SMS OTP FALLBACK for {phone}: {code}\n")
        return True  # Don't block the flow


def send_otp_to_both(email: str, phone: str) -> str:
    """
    Generate a single OTP and attempt delivery to both email and phone.
    Stores the OTP keyed by BOTH identifiers so user can verify with either.
    Returns the generated code.
    """
    code = generate_otp()

    # Store under both identifiers so login can use either
    store_otp(email, code)
    store_otp(phone, code)

    # Attempt delivery
    send_otp_email(email, code)
    send_otp_sms(phone, code)

    return code
