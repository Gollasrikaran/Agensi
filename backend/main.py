from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

from security_scanner import scan_skill, scan_skill_tier2
from payments import create_payment_intent
from auth import get_current_user, supabase
from routers import admin, users, public
from routers.mcp import mcp as fastmcp_server

app = FastAPI(title="Bodhic AI - AI Agent Skill Marketplace")

app.include_router(admin.router)
app.include_router(users.router)
app.include_router(public.router)

# Mount the FastMCP Server-Sent Events app
# Wait, FastMCP does not have `.http_app` exposed directly as ASGI maybe, but we can check.
# Let's use standard starlette mount. Wait, from the `dir(FastMCP)` I saw `mcp._setup_handlers()` and `mcp.run_http_async()`. FastMCP usually relies on its own server.
# But it does expose an ASGI app if using starlette/fastapi. 
app.mount("/mcp", fastmcp_server.http_app)

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
def get_skills(all_status: bool = False):
    try:
        if all_status:
            # Used by SSG getStaticPaths to know about all skills
            res = supabase.table("skills").select("*").execute()
        else:
            # Public browse page only sees approved skills
            res = supabase.table("skills").select("*").eq("moderation_status", "approved").execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/skills/{skill_id}")
def get_skill(skill_id: str):
    try:
        # Allow fetching approved and pending skills so creators can see their uploads
        res = supabase.table("skills").select("*").eq("id", skill_id).in_("moderation_status", ["approved", "pending"]).single().execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Skill not found")
        return res.data
    except HTTPException:
        raise
    except Exception:
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
        user_db = supabase.table("users").select("is_blocked, warnings_count").eq("id", seller_id).execute()
        if user_db.data and user_db.data[0].get("is_blocked"):
            raise HTTPException(status_code=403, detail="Your account is blocked. Please submit an appeal.")
    except HTTPException:
        raise
    except Exception as e:
        # Log so DB/column errors are visible instead of being silently ignored
        print(f"[WARN] Could not check user block status for {seller_id}: {e}")

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
    else:
        # All scans passed (or tier2 had a system error) — still needs admin approval
        moderation_status = "pending"

    # ---------------------------------------------------------------
    # IMPORTANT: Increment warnings / block the user BEFORE any DB ops.
    # Previously this was called AFTER the DB insert, so a DB error (500)
    # would prevent warnings from ever being counted and the user would
    # never get blocked no matter how many bad uploads they submitted.
    # ---------------------------------------------------------------
    if not passed_tier1:
        handle_security_failure(seller_id, scan_result_tier1, 1)
        # handle_security_failure always raises HTTPException — code below won't run
    elif not passed_tier2 and not tier2_error:
        handle_security_failure(seller_id, scan_result_tier2, 2)
        # handle_security_failure always raises HTTPException — code below won't run

    # Only approved / pending skills reach this point
    import uuid
    from datetime import datetime

    final_scan_result = {
        "tier1": scan_result_tier1,
        "tier2": scan_result_tier2
    }

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
            
        # Log activity (Streak System)
        supabase.table("user_activity").insert({
            "user_id": seller_id,
            "activity_type": "upload"
        }).execute()

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

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
    razorpay_payment_id: Optional[str] = None
    razorpay_order_id: Optional[str] = None
    razorpay_signature: Optional[str] = None

@app.post("/api/checkout/success")
def checkout_success(req: CheckoutSuccessRequest, user = Depends(get_current_user)):
    """
    Called after a successful payment (both live Razorpay and mock flow).
    - Verifies Razorpay signature (live only)
    - Records purchase in purchases table
    - Credits seller wallet (80/20 split)
    - Always returns 200 with purchase confirmation once purchase is recorded
    """
    import os, hmac, hashlib

    # 1. Verify Razorpay signature for live payments
    razorpay_key_secret = os.environ.get("RAZORPAY_KEY_SECRET")
    if razorpay_key_secret and req.razorpay_order_id and req.razorpay_payment_id and req.razorpay_signature:
        try:
            msg = f"{req.razorpay_order_id}|{req.razorpay_payment_id}"
            generated_signature = hmac.new(
                razorpay_key_secret.encode("utf-8"),
                msg.encode("utf-8"),
                hashlib.sha256
            ).hexdigest()
            if generated_signature != req.razorpay_signature:
                raise HTTPException(status_code=400, detail="Invalid payment signature. Purchase not recorded.")
        except HTTPException:
            raise
        except Exception as e:
            print(f"[WARN] Signature verification error: {e}")
            # Don't block on signature error — log and continue

    # 2. Fetch skill details
    try:
        skill_res = supabase.table("skills").select("base_price_inr, seller_id, title").eq("id", req.skill_id).single().execute()
        if not skill_res.data:
            raise HTTPException(status_code=404, detail="Skill not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch skill: {e}")

    base_price = skill_res.data["base_price_inr"]
    seller_id  = skill_res.data["seller_id"]
    buyer_id   = user.id

    # 3. Prevent duplicate purchases — return 200 (not error) if already bought
    try:
        existing = supabase.table("purchases").select("id").eq("buyer_id", buyer_id).eq("skill_id", req.skill_id).execute()
        if existing.data:
            return {"message": "Already purchased", "skill_id": req.skill_id}
    except Exception as e:
        print(f"[WARN] Duplicate check failed: {e}")

    seller_share = round(float(base_price) * 0.80, 2)

    # 4. Record the purchase — this must succeed; if it fails, return 500
    try:
        supabase.table("purchases").insert({
            "buyer_id":         buyer_id,
            "skill_id":         req.skill_id,
            "amount":           base_price,
            "currency":         "INR",
            "payment_provider": "Razorpay" if req.razorpay_payment_id else "mock",
            "payment_status":   "completed",
            "provider_txn_id":  req.razorpay_payment_id or "mock",
        }).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to record purchase: {e}")

    # 5. Credit seller wallet — isolated so a wallet error never blocks the buyer's success
    try:
        wallet_res = supabase.table("seller_wallets").select("balance_inr").eq("user_id", seller_id).execute()
        if wallet_res.data:
            new_balance = float(wallet_res.data[0]["balance_inr"]) + seller_share
            supabase.table("seller_wallets").update({"balance_inr": new_balance}).eq("user_id", seller_id).execute()
        else:
            supabase.table("seller_wallets").insert({"user_id": seller_id, "balance_inr": seller_share}).execute()
        print(f"[SALE] '{skill_res.data['title']}' sold. Seller {seller_id} credited ₹{seller_share}.")
        
        # Log activity for the seller getting a sale
        supabase.table("user_activity").insert({
            "user_id": seller_id,
            "activity_type": "sale"
        }).execute()
        
        # Also log for the buyer making a purchase
        supabase.table("user_activity").insert({
            "user_id": buyer_id,
            "activity_type": "purchase"
        }).execute()
        
    except Exception as e:
        # Wallet credit failed — log it but still return success to buyer since purchase is recorded
        print(f"[ERROR] Wallet credit failed for seller {seller_id}: {e}")

    return {"message": "Purchase recorded successfully", "credited": seller_share, "skill_id": req.skill_id}



@app.get("/api/skills/{skill_id}/download")
def download_skill(skill_id: str, user = Depends(get_current_user)):
    """
    Returns the .md content of a purchased skill.
    Only accessible to: the buyer who purchased it, or the seller who created it.
    """
    try:
        buyer_id = user.id

        # Check if this user is the seller
        skill_res = supabase.table("skills").select("seller_id, title").eq("id", skill_id).single().execute()
        if not skill_res.data:
            raise HTTPException(status_code=404, detail="Skill not found")

        is_seller = skill_res.data["seller_id"] == buyer_id

        if not is_seller:
            # Check the user has a completed purchase
            purchase = supabase.table("purchases").select("id").eq("buyer_id", buyer_id).eq("skill_id", skill_id).eq("payment_status", "completed").execute()
            if not purchase.data:
                raise HTTPException(status_code=403, detail="You have not purchased this skill.")

        # Fetch latest version content
        version = supabase.table("skill_versions").select("md_content, version_number").eq("skill_id", skill_id).order("version_number", desc=True).limit(1).execute()
        if not version.data:
            raise HTTPException(status_code=404, detail="Skill content not found")

        return {
            "title":      skill_res.data["title"],
            "content":    version.data[0]["md_content"],
            "version":    version.data[0]["version_number"],
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/users/me/sales")
def get_my_sales(user = Depends(get_current_user)):
    """
    Returns all completed purchases for skills owned by this seller.
    Does NOT expose buyer identity.
    """
    try:
        # Get all skills owned by this seller
        skills_res = supabase.table("skills").select("id, title, base_price_inr").eq("seller_id", user.id).execute()
        if not skills_res.data:
            return []

        skill_ids = [s["id"] for s in skills_res.data]
        skill_map = {s["id"]: s for s in skills_res.data}

        # Get all purchases for those skills
        purchases_res = supabase.table("purchases").select("skill_id, amount, created_at, payment_status").in_("skill_id", skill_ids).eq("payment_status", "completed").order("created_at", desc=True).execute()

        sales = []
        for p in purchases_res.data:
            skill = skill_map.get(p["skill_id"], {})
            sales.append({
                "skill_title":   skill.get("title", "Unknown"),
                "skill_id":      p["skill_id"],
                "amount_inr":    p["amount"],
                "seller_share":  round(float(p["amount"]) * 0.80, 2),
                "sold_at":       p["created_at"],
            })
        return sales
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- NEW FEATURES ---

@app.get("/api/skills/leaderboard")
def get_leaderboard():
    try:
        res = supabase.table("skills").select("*").eq("moderation_status", "approved").order("upvotes", desc=True).limit(20).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/skills/{skill_id}/upvote")
def upvote_skill(skill_id: str):
    try:
        # Fetch current upvotes and seller id
        res = supabase.table("skills").select("upvotes, seller_id").eq("id", skill_id).single().execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Skill not found")
        
        current_upvotes = res.data.get("upvotes") or 0
        seller_id = res.data.get("seller_id")
        new_upvotes = current_upvotes + 1
        
        # Update
        supabase.table("skills").update({"upvotes": new_upvotes}).eq("id", skill_id).execute()
        
        # Log activity for receiving an upvote
        if seller_id:
            supabase.table("user_activity").insert({
                "user_id": seller_id,
                "activity_type": "upvote"
            }).execute()
            
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
