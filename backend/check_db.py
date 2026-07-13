import sys
import os

with open(".env") as f:
    for line in f:
        if line.strip() and not line.startswith("#"):
            k, v = line.strip().split("=", 1)
            os.environ[k] = v

from supabase import create_client

supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])
res = supabase.table("users").select("*").limit(1).execute()
print(res.data)
