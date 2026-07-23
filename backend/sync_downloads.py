import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv(".env")
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY")

if not url or not key:
    print("Missing credentials")
    exit(1)

supabase: Client = create_client(url, key)

def sync():
    # Get all skills
    skills_res = supabase.table("skills").select("id").execute()
    skills = skills_res.data
    
    for skill in skills:
        skill_id = skill["id"]
        # Count purchases for this skill
        purchases_res = supabase.table("purchases").select("id", count="exact").eq("skill_id", skill_id).execute()
        count = purchases_res.count
        
        # Ensure count is not None
        if count is None:
            count = len(purchases_res.data)
            
        print(f"Skill {skill_id} has {count} purchases")
        
        # Update purchase_count on skills table
        try:
            supabase.table("skills").update({"purchase_count": count}).eq("id", skill_id).execute()
        except Exception as e:
            print(f"Could not update purchase_count for {skill_id}: {e}")

if __name__ == "__main__":
    sync()
