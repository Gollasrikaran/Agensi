import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv(".env")
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY")

supabase: Client = create_client(url, key)

try:
    res = supabase.table("user_activity").select("*").limit(1).execute()
    print("Columns:", res.data[0].keys() if res.data else "Empty table")
except Exception as e:
    print("Error:", e)
