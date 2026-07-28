import os
import smtplib
from email.message import EmailMessage
from datetime import datetime, time
import pytz
import logging
from dependencies import supabase

logger = logging.getLogger(__name__)

ZOHO_SMTP_SERVER = "smtp.zoho.in" # Usually smtp.zoho.in for Indian domains or smtp.zoho.com
ZOHO_SMTP_PORT = 465
ZOHO_SMTP_USER = os.environ.get("ZOHO_SMTP_USER", "support@bodhicai.tech")
ZOHO_SMTP_PASSWORD = os.environ.get("ZOHO_SMTP_PASSWORD", "Karan@Karteek1210")

def is_dnd_active(dnd_start: str, dnd_end: str, timezone: str = 'Asia/Kolkata') -> bool:
    try:
        tz = pytz.timezone(timezone)
        now_time = datetime.now(tz).time()
        start = datetime.strptime(dnd_start, "%H:%M:%S").time()
        end = datetime.strptime(dnd_end, "%H:%M:%S").time()
        
        if start <= end:
            return start <= now_time <= end
        else:
            return start <= now_time or now_time <= end
    except Exception as e:
        logger.error(f"Error checking DND: {e}")
        return False

def send_email(to_email: str, subject: str, content: str):
    if not ZOHO_SMTP_USER or not ZOHO_SMTP_PASSWORD:
        logger.warning("Zoho SMTP credentials not set, skipping email.")
        return
        
    try:
        msg = EmailMessage()
        msg.set_content(content)
        msg['Subject'] = subject
        msg['From'] = ZOHO_SMTP_USER
        msg['To'] = to_email
        
        with smtplib.SMTP_SSL(ZOHO_SMTP_SERVER, ZOHO_SMTP_PORT) as server:
            server.login(ZOHO_SMTP_USER, ZOHO_SMTP_PASSWORD)
            server.send_message(msg)
        logger.info(f"Email sent to {to_email}")
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")

def create_notification(user_id: str, type: str, title: str, message: str, link: str = None, metadata: dict = None, priority: str = 'normal'):
    try:
        # 1. Insert into DB
        notif_data = {
            "user_id": user_id,
            "type": type,
            "title": title,
            "message": message,
            "priority": priority
        }
        if link: notif_data["link"] = link
        if metadata: notif_data["metadata"] = metadata
        
        supabase.table("notifications").insert(notif_data).execute()
        
        # 2. Fetch user settings and email
        user_res = supabase.table("users").select("email").eq("id", user_id).execute()
        if not user_res.data: return
        user_email = user_res.data[0].get("email")
        if not user_email: return
        
        settings_res = supabase.table("user_settings").select("*").eq("user_id", user_id).execute()
        if not settings_res.data:
            # Fallback to default if no settings exist
            settings = {"email_notifications": True, "dnd_enabled": False}
        else:
            settings = settings_res.data[0]
            
        # 3. Check email settings and DND
        if settings.get("email_notifications", True):
            dnd_enabled = settings.get("dnd_enabled", False)
            dnd_start = settings.get("dnd_start_time", "22:00:00")
            dnd_end = settings.get("dnd_end_time", "08:00:00")
            
            if dnd_enabled and is_dnd_active(dnd_start, dnd_end):
                logger.info(f"DND active for {user_id}, skipping email.")
            else:
                send_email(user_email, title, message)
                
    except Exception as e:
        logger.error(f"Error creating notification: {e}")
