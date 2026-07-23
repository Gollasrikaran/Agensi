import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv(".env")
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY")

supabase: Client = create_client(url, key)

print("Resetting all upvotes to 0...")
try:
    # First get all skills to know their IDs
    res = supabase.table("skills").select("id").execute()
    count = 0
    for skill in res.data:
        # Update each skill to 0
        supabase.table("skills").update({"upvotes": 0}).eq("id", skill["id"]).execute()
        count += 1
    
    # Also clear any existing records in skill_upvotes if there are any
    try:
        all_upvotes = supabase.table("skill_upvotes").select("id").execute()
        for upv in all_upvotes.data:
            supabase.table("skill_upvotes").delete().eq("id", upv["id"]).execute()
    except Exception as inner_e:
        print("skill_upvotes table might not exist yet or error clearing:", inner_e)
        
    print(f"Successfully reset {count} skills to 0 upvotes.")
except Exception as e:
    print("Error:", e)
