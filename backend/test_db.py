import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv(".env")
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY")

supabase: Client = create_client(url, key)

print("Fetching all skill_upvotes:")
try:
    res = supabase.table("skill_upvotes").select("*").execute()
    for row in res.data:
        print(row)
except Exception as e:
    print("Error:", e)
