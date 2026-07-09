from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

from security_scanner import scan_skill
from payments import create_payment_intent
from auth import get_current_user, supabase
from routers import admin

app = FastAPI(title="Agensi Competitor AI Agent Skill Marketplace")

app.include_router(admin.router)

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
    base_price_usd: float

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

@app.post("/api/skills/upload")
def upload_skill(req: SkillUploadRequest, user = Depends(get_current_user)):
    # The user object is provided by Supabase Auth via the JWT
    seller_id = user.id

    # Tier 1 synchronous scan
    passed, scan_result = scan_skill(req.content)
    
    if not passed:
        raise HTTPException(status_code=400, detail={"message": "Security scan failed", "scan": scan_result})
        
    import uuid
    from datetime import datetime
    
    skill_slug = req.title.lower().replace(" ", "-") + "-" + uuid.uuid4().hex[:6]
    
    new_skill = {
        "seller_id": seller_id,
        "title": req.title,
        "slug": skill_slug,
        "description": req.description,
        "category": "code",
        "base_price_usd": req.base_price_usd,
        "is_free": req.base_price_usd == 0,
        "skill_md_file_url": "pending_upload_url",
        "moderation_status": "pending",
        "scan_summary_json": scan_result,
        "declared_capabilities_json": []
    }
    
    try:
        # Insert into skills
        skill_res = supabase.table("skills").insert(new_skill).execute()
        inserted_skill = skill_res.data[0]
        
        # Insert into security_scans
        supabase.table("security_scans").insert({
            "skill_id": inserted_skill["id"],
            "tier": 1,
            "scan_result_json": scan_result,
            "rule_categories_triggered": [issue["rule"] for issue in scan_result.get("issues", [])],
            "passed": passed
        }).execute()
        
        return {"message": "Skill uploaded successfully", "skill": inserted_skill}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.post("/api/checkout/intent")
def checkout(req: CheckoutRequest):
    try:
        res = supabase.table("skills").select("base_price_usd").eq("id", req.skill_id).single().execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Skill not found")
            
        base_price = res.data["base_price_usd"]
        intent = create_payment_intent(req.country_code, base_price)
        return intent
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

