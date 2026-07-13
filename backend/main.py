from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

from security_scanner import scan_skill, scan_skill_tier2
from payments import create_payment_intent
from auth import get_current_user, supabase
from routers import admin, users

app = FastAPI(title="Bodhic AI - AI Agent Skill Marketplace")

app.include_router(admin.router)
app.include_router(users.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SkillUploadRequest(BaseModel):
    title: str
    description: str
    content: str
    base_price_inr: float
    billing_type: str = "one-time"
    categories: list[str] = ["development"]

class CheckoutRequest(BaseModel):
    skill_id: str
    country_code: str

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Marketplace API is running"}

@app.get("/api/skills")
def get_skills():
    try:
        res = supabase.table("skills").select("*").execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/skills/{skill_id}")
def get_skill(skill_id: str):
    try:
        res = supabase.table("skills").select("*").eq("id", skill_id).single().execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Skill not found")
        return res.data
    except Exception as e:
        raise HTTPException(status_code=404, detail="Skill not found")

def send_admin_block_notification(user_id: str):
    print("*" * 50)
    print(f"AUTOMATED EMAIL NOTIFICATION TO ADMIN:")
    print(f"Subject: Security Alert: User Blocked")
    print(f"Body: User {user_id} has exceeded the 3-strike security limit and has been automatically blocked.")
    print("*" * 50)

def handle_security_failure(user_id: str, scan_result: dict, tier: int):
    try:
        user_db = supabase.table("users").select("warnings_count").eq("id", user_id).execute()
        current_warnings = user_db.data[0].get("warnings_count", 0) if user_db.data else 0
        new_warnings = current_warnings + 1
        
        update_data = {"warnings_count": new_warnings}
        
        if new_warnings >= 3:
            update_data["is_blocked"] = True
            
        supabase.table("users").update(update_data).eq("id", user_id).execute()
        
        if new_warnings >= 3:
            send_admin_block_notification(user_id)
            raise HTTPException(status_code=403, detail={"message": f"Security scan failed at Tier {tier}. You have exceeded your 3 warnings and are now blocked. Please appeal.", "scan": scan_result})
        else:
            raise HTTPException(status_code=400, detail={"message": f"Security scan failed at Tier {tier}. Warning {new_warnings}/3.", "scan": scan_result})
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/skills/upload")
def upload_skill(req: SkillUploadRequest, user = Depends(get_current_user)):
    # The user object is provided by Supabase Auth via the JWT
    seller_id = user.id
    
    # Pre-check if user is blocked
    try:
        user_db = supabase.table("users").select("is_blocked").eq("id", seller_id).execute()
        if user_db.data and user_db.data[0].get("is_blocked"):
            raise HTTPException(status_code=403, detail="Your account is blocked. Please submit an appeal.")
    except HTTPException:
        raise
    except Exception:
        pass

    # Tier 1 synchronous scan
    passed_tier1, scan_result_tier1 = scan_skill(req.content)
    
    tier2_error = False
    passed_tier2 = True
    scan_result_tier2 = {}
    
    if passed_tier1:
        # Tier 2 synchronous scan (Cloudflare Workers AI)
        passed_tier2, scan_result_tier2 = scan_skill_tier2(req.content)
        
        if not passed_tier2:
            issues = scan_result_tier2.get("issues", [])
            is_system_error = any(issue.get("rule") in ["tier2_error", "llm_parse_error"] for issue in issues)
            if is_system_error:
                tier2_error = True
                print("Tier 2 AI system error. Falling back to pending/manual review.")
    
    # Determine status
    if not passed_tier1 or (not passed_tier2 and not tier2_error):
        moderation_status = "rejected"
    elif tier2_error:
        moderation_status = "pending"
    else:
        moderation_status = "approved"

    # Combine scan results for database
    final_scan_result = {
        "tier1": scan_result_tier1,
        "tier2": scan_result_tier2
    }
        
    import uuid
    from datetime import datetime
    
    skill_slug = req.title.lower().replace(" ", "-") + "-" + uuid.uuid4().hex[:6]
    
    new_skill = {
        "seller_id": seller_id,
        "title": req.title,
        "slug": skill_slug,
        "description": req.description,
        "category": ",".join(req.categories),
        "base_price_inr": req.base_price_inr,
        "is_free": req.base_price_inr == 0,
        "billing_type": req.billing_type,
        "skill_md_file_url": "pending_upload_url",
        "moderation_status": moderation_status,
        "scan_summary_json": final_scan_result,
        "declared_capabilities_json": []
    }
    
    try:
        # Insert into skills
        skill_res = supabase.table("skills").insert(new_skill).execute()
        inserted_skill = skill_res.data[0]
        
        # Insert into skill_versions to store the MD content
        supabase.table("skill_versions").insert({
            "skill_id": inserted_skill["id"],
            "version_number": 1,
            "md_content": req.content,
            "changelog": "Initial upload"
        }).execute()
        
        # Insert into security_scans (Tier 1)
        supabase.table("security_scans").insert({
            "skill_id": inserted_skill["id"],
            "tier": 1,
            "scan_result_json": scan_result_tier1,
            "rule_categories_triggered": [issue["rule"] for issue in scan_result_tier1.get("issues", [])],
            "passed": passed_tier1
        }).execute()
        
        # Insert into security_scans (Tier 2) if run
        if scan_result_tier2:
            supabase.table("security_scans").insert({
                "skill_id": inserted_skill["id"],
                "tier": 2,
                "scan_result_json": scan_result_tier2,
                "rule_categories_triggered": [issue["rule"] for issue in scan_result_tier2.get("issues", [])],
                "passed": passed_tier2
            }).execute()
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        
    # Trigger blocks if rejected
    if not passed_tier1:
        handle_security_failure(seller_id, scan_result_tier1, 1)
    elif not passed_tier2 and not tier2_error:
        handle_security_failure(seller_id, scan_result_tier2, 2)
        
    return {"message": "Skill uploaded successfully", "skill": inserted_skill}

@app.post("/api/checkout/intent")
def checkout(req: CheckoutRequest):
    try:
        res = supabase.table("skills").select("base_price_inr").eq("id", req.skill_id).single().execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Skill not found")
            
        base_price = res.data["base_price_inr"]
        intent = create_payment_intent(req.country_code, base_price)
        return intent
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class CheckoutSuccessRequest(BaseModel):
    skill_id: str

@app.post("/api/checkout/success")
def checkout_success(req: CheckoutSuccessRequest):
    try:
        skill_res = supabase.table("skills").select("base_price_inr, seller_id").eq("id", req.skill_id).single().execute()
        if not skill_res.data:
            raise HTTPException(status_code=404, detail="Skill not found")
            
        base_price = skill_res.data["base_price_inr"]
        seller_id = skill_res.data["seller_id"]
        
        seller_share = base_price * 0.80
        
        update_res = supabase.table("seller_wallets").select("balance_inr").eq("user_id", seller_id).execute()
        if update_res.data:
            new_balance = float(update_res.data[0]["balance_inr"]) + seller_share
            supabase.table("seller_wallets").update({"balance_inr": new_balance}).eq("user_id", seller_id).execute()
        else:
            supabase.table("seller_wallets").insert({"user_id": seller_id, "balance_inr": seller_share}).execute()
            
        return {"message": "Wallet credited successfully", "credited": seller_share}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- NEW FEATURES ---

@app.get("/api/skills/leaderboard")
def get_leaderboard():
    try:
        res = supabase.table("skills").select("*").order("upvotes", desc=True).limit(20).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/skills/{skill_id}/upvote")
def upvote_skill(skill_id: str):
    try:
        # Fetch current upvotes
        res = supabase.table("skills").select("upvotes").eq("id", skill_id).single().execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Skill not found")
        
        current_upvotes = res.data.get("upvotes") or 0
        new_upvotes = current_upvotes + 1
        
        # Update
        supabase.table("skills").update({"upvotes": new_upvotes}).eq("id", skill_id).execute()
        return {"message": "Upvoted", "upvotes": new_upvotes}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class SkillRequestModel(BaseModel):
    title: str
    description: str
    bounty_inr: float

@app.post("/api/requests")
def create_skill_request(req: SkillRequestModel, user = Depends(get_current_user)):
    try:
        new_req = {
            "buyer_id": user.id,
            "title": req.title,
            "description": req.description,
            "bounty_inr": req.bounty_inr,
            "status": "open"
        }
        res = supabase.table("skill_requests").insert(new_req).execute()
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/requests")
def get_skill_requests():
    try:
        res = supabase.table("skill_requests").select("*").order("created_at", desc=True).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
