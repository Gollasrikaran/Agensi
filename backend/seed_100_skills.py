import os
import json
import random
from supabase import create_client, Client

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.")
    exit(1)

supabase: Client = create_client(url, key)

print("Starting 100-Skill Seeding Process...")
print("Backing up DB is recommended before running this script.")

# 1. Create Fake Creators
creators = [
    {"username": "StudentHacks", "bio": "Automating college life.", "email": "studenthacks@bodhic.test"},
    {"username": "PlacementPro", "bio": "Ex-FAANG recruiter.", "email": "placementpro@bodhic.test"},
    {"username": "DevOpsGuru", "bio": "I write bash so you don't have to.", "email": "devops@bodhic.test"},
    {"username": "JugaadKing", "bio": "Last minute lifesavers.", "email": "jugaad@bodhic.test"}
]

creator_ids = []

try:
    for c in creators:
        # We need a user in auth.users ideally, but we can just insert into public.users
        # For a true seed, we can just use uuid generation
        import uuid
        uid = str(uuid.uuid4())
        
        # Note: If public.users has a foreign key to auth.users, this might fail unless we insert into auth.users first.
        # But this is a seed script, assuming we can insert into auth.users or skip auth check for service role.
        # Let's try to insert into users table (it might require auth trigger).
        # To be safe, we will just use the first existing user in the DB as the seller for all seeds, OR create one.
        
        existing_users = supabase.table("users").select("id").limit(1).execute()
        if existing_users.data:
            creator_ids.append(existing_users.data[0]["id"])
            print(f"Using existing user {creator_ids[0]} as creator.")
            break
        else:
            print("No existing users found. Please create at least one user via signup first.")
            exit(1)

    seller_id = creator_ids[0]

    skills_to_seed = [
        {"title": "Local PDF to Handwritten Text", "category": "College Jugaad", "price": 40, "complexity": 3, "audience": "student", "desc": "Convert typed assignments to script fonts."},
        {"title": "TCS NQT Aptitude Solver", "category": "Placements", "price": 20, "complexity": 2, "audience": "student", "desc": "Pass placement tests instantly."},
        {"title": "Docker Compose Generator", "category": "DevOps", "price": 70, "complexity": 4, "audience": "professional", "desc": "Scaffolds local infra."},
        {"title": "Codebase Linter Fixer", "category": "Development", "price": 100, "complexity": 5, "audience": "professional", "desc": "Fixes 10,000 ESLint errors automatically."},
        # In a real run, all 100 skills would be listed here.
    ]

    # Generate 96 more dummy skills to reach 100
    for i in range(5, 101):
        is_student = random.choice([True, False])
        skills_to_seed.append({
            "title": f"Auto-Agent Skill #{i}",
            "category": "Generated" if is_student else "Pro Tools",
            "price": random.choice([10, 20, 40, 70, 100]),
            "complexity": random.randint(1, 5),
            "audience": "student" if is_student else "professional",
            "desc": f"An automated skill for {'students' if is_student else 'professionals'}."
        })

    print(f"Seeding {len(skills_to_seed)} skills...")
    
    # Wrap in simple batch/loop
    for idx, s in enumerate(skills_to_seed):
        slug = s["title"].lower().replace(" ", "-").replace("#", "") + f"-{idx}"
        
        skill_res = supabase.table("skills").insert({
            "seller_id": seller_id,
            "title": s["title"],
            "slug": slug,
            "description": s["desc"],
            "category": s["category"],
            "base_price_usd": s["price"] / 100.0, # Dummy conversion
            "moderation_status": "approved",
            "target_audience": s["audience"],
            "complexity_level": s["complexity"]
        }).execute()
        
        skill_id = skill_res.data[0]["id"]
        
        supabase.table("skill_versions").insert({
            "skill_id": skill_id,
            "version_number": 1,
            "md_content": f"You are a helpful assistant providing {s['title']}."
        }).execute()
        
    print("Seeding complete! 100 skills injected.")

except Exception as e:
    print("Error occurred! Transaction Rollback recommended (not native in REST, but we abort further inserts).")
    print(str(e))
