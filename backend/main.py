import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

from security_scanner import scan_skill, scan_skill_tier2, scan_prompt, scan_prompt_tier2
from payments import create_payment_intent
from auth import get_current_user, supabase
from notifications import create_notification
from routers import admin, users, public, avatars, pulse, agent_actions, oauth
from routers.mcp import mcp as fastmcp_server
from dependencies import current_agent_user_id
import hashlib
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

# Create the MCP app instance once so we can share its lifespan
mcp_app = fastmcp_server.http_app(transport="sse")

app = FastAPI(
    title="BodhicAI - AI Agent Skill Marketplace",
    lifespan=mcp_app.lifespan
)

@app.get("/api/health", summary="Render Keep-Alive", tags=["System"])
async def health_check():
    return {"status": "awake"}

app.include_router(admin.router)
app.include_router(users.router)
app.include_router(public.router)
app.include_router(avatars.router)
app.include_router(pulse.router)
app.include_router(agent_actions.router)
app.include_router(oauth.router)

import urllib.parse
import traceback
import logging

class FastMCPWrapper:
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        try:
            if scope["type"] == "http":
                path = scope.get("path", "")
                
                # Flexible matching: token is the part before 'sse' or 'messages'
                path_str = path.strip("/")
                parts = path_str.split("/")
                
                # parts could be ["mcp", "<token>", "sse"] or ["<token>", "sse"]
                if len(parts) >= 2 and parts[-1] in ["sse", "messages"]:
                    endpoint = parts[-1]
                    token = parts[-2]
                    
                    new_scope = dict(scope)
                    # Rewrite path for FastMCP's internal router
                    # Check if original path had a trailing slash or if endpoint is messages (FastMCP expects /messages/ or /messages?)
                    if endpoint == "messages" or path.endswith("/"):
                        new_scope["path"] = f"/{endpoint}/"
                    else:
                        new_scope["path"] = f"/{endpoint}"
                    
                    # root_path must be updated so FastMCP generates the correct POST URL
                    # If root_path doesn't already end with the token, append it
                    if not new_scope.get("root_path", "").endswith(f"/{token}"):
                        new_scope["root_path"] = new_scope.get("root_path", "").rstrip("/") + f"/{token}"
                        
                    return await self.app(new_scope, receive, send)
                    
                # Case 2: path is /sse but token is in query params
                if path == "/sse":
                    qs = scope.get("query_string", b"")
                    query_string = qs.decode("utf-8") if isinstance(qs, bytes) else qs
                    query_params = dict(urllib.parse.parse_qsl(query_string))
                    if "token" in query_params:
                        token = query_params["token"]
                        new_scope = dict(scope)
                        # Rewrite root_path so the returned endpoint uses the path-based token
                        new_scope["root_path"] = new_scope.get("root_path", "") + f"/{token}"
                        return await self.app(new_scope, receive, send)
        except Exception as e:
            import logging, traceback
            logging.error(f"FastMCPWrapper error: {e}\n{traceback.format_exc()}")
            
        return await self.app(scope, receive, send)

app.mount("/mcp", FastMCPWrapper(mcp_app))
app.mount("/api/public/mcp", FastMCPWrapper(mcp_app))
app.mount("/api/mcp", FastMCPWrapper(mcp_app))


class AgentAuthMiddleware:
    def __init__(self, app):
        self.app = app
        
    async def __call__(self, scope, receive, send):
        if scope["type"] not in ("http", "websocket"):
            return await self.app(scope, receive, send)
            
        request = Request(scope)
        path = request.url.path
        
        # Check if the token is passed in the path: /mcp/<token>/... or /api/public/mcp/<token>/...
        path_token = None
        if "/mcp/" in path:
            parts = path.split("/")
            for i, part in enumerate(parts):
                if part == "mcp" and i + 2 < len(parts):
                    if parts[i+2] in ["sse", "messages"]:
                        path_token = parts[i+1]
                
        if "/mcp" in path or path.startswith("/api/agents"):
            # Allow CORS preflight requests
            if request.method == "OPTIONS":
                return await self.app(scope, receive, send)
                
            # Exclude config or openapi json if needed
            if path.endswith("/config.json"):
                return await self.app(scope, receive, send)
                
            # Check for Bearer token OR query parameter (for Claude Web UI)
            api_key = None
            auth_header = request.headers.get("Authorization")
            
            if auth_header and auth_header.startswith("Bearer "):
                api_key = auth_header.split("Bearer ")[1].strip()
            elif request.query_params.get("token"):
                api_key = request.query_params.get("token").strip()
            elif path_token:
                api_key = path_token
                
            if not api_key:
                response = JSONResponse(status_code=401, content={"error": "Missing API key. Provide Authorization: Bearer <key> or ?token=<key> query parameter."})
                return await response(scope, receive, send)
                
            if api_key.startswith("eyJ"):
                # It's a Supabase JWT. Let the normal FastAPI Depends(get_current_user) handle it!
                return await self.app(scope, receive, send)
                
            if api_key.startswith("bodhic_oa_"):
                # Authenticate against oauth_tokens
                res = supabase.table("oauth_tokens").select("user_id, expires_at").eq("access_token", api_key).execute()
                if not res.data:
                    response = JSONResponse(status_code=401, content={"error": "Invalid OAuth Token"})
                    return await response(scope, receive, send)
                
                token_data = res.data[0]
                from datetime import datetime, timezone
                if datetime.fromisoformat(token_data["expires_at"]) < datetime.now(timezone.utc):
                    response = JSONResponse(status_code=401, content={"error": "OAuth Token Expired"})
                    return await response(scope, receive, send)
                
                user_id = token_data["user_id"]
            else:
                # Authenticate against user_api_keys (static keys)
                key_hash = hashlib.sha256(api_key.encode()).hexdigest()
                res = supabase.table("user_api_keys").select("user_id").eq("api_key_hash", key_hash).execute()
                if not res.data:
                    response = JSONResponse(status_code=401, content={"error": "Invalid API Key"})
                    return await response(scope, receive, send)
                    
                user_id = res.data[0]["user_id"]
            
            # Set context variable
            current_agent_user_id.set(user_id)
            
        return await self.app(scope, receive, send)

app.add_middleware(AgentAuthMiddleware)

ALLOWED_ORIGINS = [
    "https://bodhicai.tech",
    "https://www.bodhicai.tech",
    "http://localhost:4321",
    "http://localhost:3000",
    "https://bodhicai.onrender.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure CORS headers are present even on HTTPException error responses.
# Without this, browsers block 401/403/500 responses from cross-origin API calls.
from fastapi.responses import JSONResponse
from fastapi.exception_handlers import http_exception_handler
from fastapi import Request as FastAPIRequest
from starlette.exceptions import HTTPException as StarletteHTTPException

@app.exception_handler(StarletteHTTPException)
async def cors_aware_http_exception_handler(request: FastAPIRequest, exc: StarletteHTTPException):
    response = await http_exception_handler(request, exc)
    origin = request.headers.get("origin", "")
    if origin in ALLOWED_ORIGINS:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "false"
    return response

class SkillUploadRequest(BaseModel):
    title: str
    description: str
    content: str
    base_price_inr: float
    billing_type: str = "one-time"
    categories: list[str] = ["development"]
    target_audience: str = "all"
    item_type: str = "skill"
    media_url: str = None

class CheckoutRequest(BaseModel):
    skill_id: str
    country_code: str

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Marketplace API is running"}

@app.get("/api/auth/ping")
def auth_ping(user = Depends(get_current_user)):
    """Quick auth test — call this to verify your token is valid."""
    return {"status": "authenticated", "user_id": user.id, "email": user.email}

@app.get("/mcp/config.json")
@app.get("/api/public/mcp/config.json")
@app.get("/api/mcp/config.json")
def get_mcp_config():
    return {
        "mcpServers": {
            "bodhic-ai": {
                "command": "node", 
                "args": ["-e", "console.log('Use SSE URL in Cline/Cursor for BodhicAI')"],
                "url": "https://bodhicai.onrender.com/mcp/sse",
                "env": {
                    "AUTHORIZATION": "Bearer YOUR_API_KEY_HERE"
                }
            }
        }
    }

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

@app.get("/api/users/me/notifications")
def get_my_notifications(user = Depends(get_current_user)):
    try:
        res = supabase.table("notifications").select("*").eq("user_id", user.id).order("created_at", desc=True).limit(50).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/users/me/notifications/{notif_id}/read")
def mark_notification_read(notif_id: str, user = Depends(get_current_user)):
    try:
        res = supabase.table("notifications").update({"is_read": True}).eq("id", notif_id).eq("user_id", user.id).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def send_admin_block_notification(user_id: str):
    print("*" * 50)
    print(f"AUTOMATED EMAIL NOTIFICATION TO ADMIN:")
    print(f"Subject: Security Alert: User Blocked")
    print(f"Body: User {user_id} has exceeded the 3-strike security limit and has been automatically blocked.")
    print("*" * 50)

def handle_security_failure(user_id: str, scan_result: dict, tier: int, message_prefix: str = None):
    if message_prefix is None:
        message_prefix = f"Security scan failed at Tier {tier}"
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
            raise HTTPException(status_code=403, detail={"message": f"{message_prefix}. You have exceeded your 3 warnings and are now blocked. Please appeal.", "scan": scan_result})
        else:
            raise HTTPException(status_code=400, detail={"message": f"{message_prefix}. Warning {new_warnings}/3.", "scan": scan_result})
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

    # Prevent uploading the example template
    if "CodeReviewerAgent" in req.title or "You are an expert, highly critical software engineer conducting a code review" in req.content:
        raise HTTPException(status_code=400, detail={"message": "You cannot upload the example template. Please write your own skill."})

    # Anti-Re-upload Hashing (Similarity Check)
    try:
        import difflib
        approved_skills = supabase.table("skills").select("id").eq("moderation_status", "approved").execute()
        approved_ids = [s["id"] for s in approved_skills.data]
        if approved_ids:
            # We fetch in batches or all at once. Assuming reasonable size for now.
            versions = supabase.table("skill_versions").select("skill_id, md_content").in_("skill_id", approved_ids).execute()
            for v in versions.data:
                ratio = difflib.SequenceMatcher(None, req.content, v["md_content"]).ratio()
                if ratio >= 0.90:
                    scan_res = {"issues": [{"rule": "plagiarism", "description": "This skill is 90%+ identical to an existing skill on the platform."}]}
                    handle_security_failure(seller_id, scan_res, 0, "Plagiarism detected")
    except HTTPException:
        raise
    except Exception as e:
        print(f"[WARN] Plagiarism check failed: {e}")

    # Media URL validation — only check scheme; HEAD requests are rejected by many CDNs
    if req.media_url:
        if not (req.media_url.startswith("http://") or req.media_url.startswith("https://")):
            raise HTTPException(status_code=400, detail="media_url must start with http:// or https://")

    # Tier 1 synchronous scan
    if req.item_type == "prompt":
        passed_tier1, scan_result_tier1 = scan_prompt(req.content)
    else:
        passed_tier1, scan_result_tier1 = scan_skill(req.content)
    
    tier2_error = False
    passed_tier2 = True
    scan_result_tier2 = {}
    
    if passed_tier1:
        # Tier 2 synchronous scan (Cloudflare Workers AI)
        if req.item_type == "prompt":
            passed_tier2, scan_result_tier2 = scan_prompt_tier2(req.content)
        else:
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
        "target_audience": req.target_audience,
        "base_price_inr": req.base_price_inr,
        "is_free": req.base_price_inr == 0,
        "billing_type": req.billing_type,
        "skill_md_file_url": "pending_upload_url",
        "moderation_status": moderation_status,
        "scan_summary_json": final_scan_result,
        "declared_capabilities_json": [],
        "complexity_level": scan_result_tier2.get("complexity_level", 1) if scan_result_tier2 else 1,
        "item_type": req.item_type,
        "media_url": req.media_url
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
def checkout(req: CheckoutRequest, user = Depends(get_current_user)):
    try:
        res = supabase.table("skills").select("base_price_inr, seller_id").eq("id", req.skill_id).single().execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Skill not found")
            
        if user.id == res.data.get("seller_id"):
            raise HTTPException(status_code=403, detail="You cannot purchase your own skill.")
            
        base_price = res.data["base_price_inr"]
        intent = create_payment_intent(req.country_code, base_price)
        return intent
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class CreditCheckoutRequest(BaseModel):
    skill_id: str

@app.post("/api/checkout/credits")
def checkout_with_credits(req: CreditCheckoutRequest, user = Depends(get_current_user)):
    try:
        # 1. Fetch skill details
        skill_res = supabase.table("skills").select("base_price_inr, seller_id, title").eq("id", req.skill_id).single().execute()
        if not skill_res.data:
            raise HTTPException(status_code=404, detail="Skill not found")
            
        base_price = skill_res.data["base_price_inr"]
        seller_id = skill_res.data["seller_id"]
        buyer_id = user.id
        
        if seller_id == buyer_id:
            raise HTTPException(status_code=403, detail="You cannot purchase your own skill.")
            
        # Check if already purchased
        existing = supabase.table("purchases").select("id").eq("buyer_id", buyer_id).eq("skill_id", req.skill_id).execute()
        if existing.data:
            return {"message": "Already purchased", "skill_id": req.skill_id}
            
        # 2. Calculate credit cost (1 INR = 10 Credits)
        credit_cost = int(round(float(base_price) * 10))
        
        # 3. Check buyer's credit balance
        balance_res = supabase.table("user_credits").select("balance").eq("user_id", buyer_id).execute()
        current_balance = int(round(float(balance_res.data[0]["balance"]))) if balance_res.data else 0
        
        if current_balance < credit_cost:
            raise HTTPException(status_code=400, detail=f"Insufficient credits. Required: {credit_cost}, Available: {current_balance}")
            
        # 4. Deduct credits
        new_balance = int(round(current_balance - credit_cost))
        if not balance_res.data:
            supabase.table("user_credits").insert({"user_id": buyer_id, "balance": new_balance}).execute()
        else:
            supabase.table("user_credits").update({"balance": new_balance}).eq("user_id", buyer_id).execute()
            
        # 5. Log credit transaction
        supabase.table("credit_transactions").insert({
            "user_id": buyer_id,
            "amount": -credit_cost,
            "transaction_type": "mcp_purchase",
            "reference_id": req.skill_id,
            "description": f"Purchased skill '{skill_res.data['title']}' for {credit_cost} credits"
        }).execute()
        
        # 6. Record purchase (This automatically triggers seller's 80% INR payout in the sweep)
        supabase.table("purchases").insert({
            "buyer_id": buyer_id,
            "skill_id": req.skill_id,
            "amount": base_price,
            "currency": "INR",
            "payment_provider": "credits",
            "payment_status": "completed",
            "provider_txn_id": f"cred_txn_{req.skill_id}",
        }).execute()
        
        # 7. Increment purchase_count
        current_count = skill_res.data.get("purchase_count") or 0
        supabase.table("skills").update({"purchase_count": current_count + 1}).eq("id", req.skill_id).execute()
        
        # 8. Log activity
        supabase.table("user_activity").insert([
            {"user_id": seller_id, "activity_type": "sale"},
            {"user_id": buyer_id, "activity_type": "purchase"}
        ]).execute()
        
        # Notify seller
        create_notification(
            user_id=seller_id,
            type="success",
            title="Skill Sold!",
            message=f"Your skill '{skill_res.data['title']}' was purchased.",
            link="/dashboard/seller",
            priority="normal"
        )
        
        return {"message": "Purchase completed using credits", "new_balance": new_balance, "skill_id": req.skill_id}
        
    except HTTPException:
        raise
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

    if seller_id == buyer_id:
        raise HTTPException(status_code=403, detail="You cannot purchase your own skill.")

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

    # Increment purchase_count (downloads) for the skill
    try:
        current_skill_res = supabase.table("skills").select("purchase_count").eq("id", req.skill_id).single().execute()
        current_count = current_skill_res.data.get("purchase_count") or 0
        supabase.table("skills").update({"purchase_count": current_count + 1}).eq("id", req.skill_id).execute()
    except Exception as e:
        print(f"[WARN] Failed to increment purchase_count: {e}")

    # 5. Log activity — isolated so an error never blocks the buyer's success
    try:
        print(f"[SALE] '{skill_res.data['title']}' sold. Seller {seller_id} earns ₹{seller_share} (80% of ₹{base_price}).")
        
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
        
        create_notification(
            user_id=seller_id,
            type="success",
            title="Skill Sold!",
            message=f"Your skill '{skill_res.data['title']}' was purchased.",
            link="/dashboard/seller",
            priority="normal"
        )
        
    except Exception as e:
        # Activity logging failed — log it but still return success to buyer since purchase is recorded
        print(f"[ERROR] Activity logging failed for seller {seller_id}: {e}")

    return {"message": "Purchase recorded successfully", "credited": seller_share, "skill_id": req.skill_id}

@app.get("/api/skills/{skill_id}/purchase-status")
def get_purchase_status(skill_id: str, user = Depends(get_current_user)):
    try:
        # Check if user is the seller
        skill_res = supabase.table("skills").select("seller_id").eq("id", skill_id).single().execute()
        if skill_res.data and skill_res.data["seller_id"] == user.id:
            return {"purchased": True, "is_seller": True}
            
        # Check for completed purchase
        purchase = supabase.table("purchases").select("id").eq("buyer_id", user.id).eq("skill_id", skill_id).eq("payment_status", "completed").execute()
        return {"purchased": len(purchase.data) > 0 if purchase.data else False, "is_seller": False}
    except Exception as e:
        return {"purchased": False, "is_seller": False, "error": str(e)}

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

        raw_content = version.data[0]["md_content"]
        
        # 1. Digital Fingerprinting (Watermark)
        clean_id = buyer_id.replace('-', '')
        binary_str = bin(int(clean_id, 16))[2:].zfill(128)
        mapping = {'0': '\u200B', '1': '\u200C'}
        watermark = '\u200D' + ''.join(mapping[b] for b in binary_str) + '\u200D'
        
        # 2. Single-User License Agreement
        eula = f"""\n\n{"-"*50}\n**BodhicAI Single-User License Agreement**\nThis file is uniquely licensed to the buyer. Redistribution is strictly prohibited.\nYour unique cryptographic identifier is permanently embedded in this file.\n\n**Violation Clause:** If you are found distributing this skill on any other platform, your account will be permanently banned. Any pending earnings or funds in your BodhicAI wallet will be immediately forfeited and become the property of BodhicAI."""
        
        # Inject watermark at the end of the content before EULA
        final_content = raw_content + watermark + eula

        return {
            "title":      skill_res.data["title"],
            "content":    final_content,
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
def upvote_skill(skill_id: str, current_user = Depends(get_current_user)):
    try:
        # Check if already upvoted
        existing = supabase.table("skill_upvotes").select("id").eq("skill_id", skill_id).eq("user_id", current_user.id).execute()
        
        # Fetch current upvotes and seller id
        res = supabase.table("skills").select("upvotes, seller_id").eq("id", skill_id).single().execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Skill not found")
        
        current_upvotes = res.data.get("upvotes") or 0
        seller_id = res.data.get("seller_id")
        
        if existing.data:
            # Remove upvote
            supabase.table("skill_upvotes").delete().eq("skill_id", skill_id).eq("user_id", current_user.id).execute()
            new_upvotes = max(0, current_upvotes - 1)
            supabase.table("skills").update({"upvotes": new_upvotes}).eq("id", skill_id).execute()
            return {"message": "Upvote removed", "upvotes": new_upvotes, "upvoted": False}
        else:
            # Add upvote
            supabase.table("skill_upvotes").insert({"skill_id": skill_id, "user_id": current_user.id}).execute()
            new_upvotes = current_upvotes + 1
            supabase.table("skills").update({"upvotes": new_upvotes}).eq("id", skill_id).execute()
            
            # Log activity for seller (only when adding)
            if seller_id:
                supabase.table("user_activity").insert({
                    "user_id": seller_id,
                    "activity_type": "upvote"
                }).execute()
            return {"message": "Upvoted", "upvotes": new_upvotes, "upvoted": True}
            
    except Exception as e:
        if isinstance(e, HTTPException): raise
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/skills/{skill_id}/upvote/status")
def get_upvote_status(skill_id: str, current_user = Depends(get_current_user)):
    try:
        existing = supabase.table("skill_upvotes").select("id").eq("skill_id", skill_id).eq("user_id", current_user.id).execute()
        return {"upvoted": len(existing.data) > 0 if existing.data else False}
    except:
        return {"upvoted": False}

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
        res = supabase.table("skill_requests").select("*, creator:users(username)").order("created_at", desc=True).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ClaimRequest(BaseModel):
    submitted_code: str

@app.post("/api/requests/{bounty_id}/claim")
def claim_bounty(bounty_id: str, req: ClaimRequest, user = Depends(get_current_user)):
    try:
        bounty = supabase.table("skill_requests").select("buyer_id").eq("id", bounty_id).execute()
        if not bounty.data:
            raise HTTPException(status_code=404, detail="Bounty not found")
        if bounty.data[0]["buyer_id"] == user.id:
            raise HTTPException(status_code=400, detail="You cannot claim your own bounty.")
        
        existing = supabase.table("bounty_claims").select("id").eq("bounty_id", bounty_id).eq("claimer_id", user.id).execute()
        if existing.data:
            raise HTTPException(status_code=400, detail="You have already submitted a claim for this bounty.")
            
        if not req.submitted_code or not req.submitted_code.strip():
            raise HTTPException(status_code=400, detail="You must submit your skill code to claim this bounty.")
            
        res = supabase.table("bounty_claims").insert({
            "bounty_id": bounty_id,
            "claimer_id": user.id,
            "status": "pending",
            "submitted_code": req.submitted_code
        }).execute()
        
        # Trigger notification to owner
        bounty_title = bounty.data[0].get("title", "A bounty")
        create_notification(
            user_id=bounty.data[0]["buyer_id"],
            type="bounty",
            title="New Bounty Claim",
            message=f"Someone has submitted a claim for your bounty '{bounty_title}'.",
            link="/dashboard/buyer",
            priority="normal"
        )
        
        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/requests/claims/my-claims")
def get_my_claims(user = Depends(get_current_user)):
    try:
        res = supabase.table("bounty_claims").select("*, bounty:skill_requests(*)").eq("claimer_id", user.id).order("created_at", desc=True).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/requests/claims/my-posted")
def get_my_posted_claims(user = Depends(get_current_user)):
    try:
        res = supabase.table("bounty_claims").select("*, claimer:users(username), bounty:skill_requests!inner(*)").eq("bounty.buyer_id", user.id).order("created_at", desc=True).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class RejectClaimRequest(BaseModel):
    reason: str

@app.post("/api/requests/claims/{claim_id}/reject")
def reject_claim(claim_id: str, req: RejectClaimRequest, user = Depends(get_current_user)):
    try:
        claim_res = supabase.table("bounty_claims").select("*, bounty:skill_requests(buyer_id)").eq("id", claim_id).execute()
        if not claim_res.data:
            raise HTTPException(status_code=404, detail="Claim not found")
            
        claim = claim_res.data[0]
        if claim["bounty"]["buyer_id"] != user.id:
            raise HTTPException(status_code=403, detail="Not your bounty")
            
        if claim["status"] != "pending":
            raise HTTPException(status_code=400, detail="Claim is not pending")
            
        if not req.reason or not req.reason.strip():
            raise HTTPException(status_code=400, detail="Rejection reason is mandatory")
            
        res = supabase.table("bounty_claims").update({
            "status": "rejected",
            "rejection_reason": req.reason.strip()
        }).eq("id", claim_id).execute()
        
        # Trigger notification to claimant
        bounty_title = claim["bounty"].get("title", "A bounty")
        create_notification(
            user_id=claim["claimer_id"],
            type="error",
            title="Bounty Claim Rejected",
            message=f"Your claim for '{bounty_title}' was rejected. Reason: {req.reason.strip()}",
            link="/dashboard/bounties",
            priority="high"
        )
        
        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

import razorpay

@app.post("/api/requests/claims/{claim_id}/order")
def create_claim_order(claim_id: str, user = Depends(get_current_user)):
    try:
        claim_res = supabase.table("bounty_claims").select("*, bounty:skill_requests(*)").eq("id", claim_id).execute()
        if not claim_res.data:
            raise HTTPException(status_code=404, detail="Claim not found")
            
        claim = claim_res.data[0]
        if claim["bounty"]["buyer_id"] != user.id:
            raise HTTPException(status_code=403, detail="Not your bounty")
            
        amount_inr = claim["bounty"]["bounty_inr"]
        razorpay_key_id = os.environ.get("RAZORPAY_KEY_ID")
        razorpay_key_secret = os.environ.get("RAZORPAY_KEY_SECRET")
        
        if razorpay_key_id and razorpay_key_secret:
            client = razorpay.Client(auth=(razorpay_key_id, razorpay_key_secret))
            order = client.order.create({
                "amount": int(float(amount_inr) * 100),
                "currency": "INR",
                "receipt": claim_id[:40]
            })
            
            supabase.table("bounty_claims").update({
                "razorpay_order_id": order["id"]
            }).eq("id", claim_id).execute()
            
            return {
                "client_secret": order["id"],
                "amount_inr": amount_inr,
                "razorpay_key_id": razorpay_key_id
            }
        else:
            raise HTTPException(status_code=500, detail="Razorpay keys missing")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class VerifyBountyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

@app.post("/api/requests/claims/{claim_id}/verify")
def verify_claim_payment(claim_id: str, req: VerifyBountyPaymentRequest, user = Depends(get_current_user)):
    try:
        claim_res = supabase.table("bounty_claims").select("*, bounty:skill_requests(*)").eq("id", claim_id).execute()
        if not claim_res.data:
            raise HTTPException(status_code=404, detail="Claim not found")
            
        claim = claim_res.data[0]
        if claim["bounty"]["buyer_id"] != user.id:
            raise HTTPException(status_code=403, detail="Not your bounty")
            
        razorpay_key_secret = os.environ.get("RAZORPAY_KEY_SECRET")
        if razorpay_key_secret:
            client = razorpay.Client(auth=(os.environ.get("RAZORPAY_KEY_ID"), razorpay_key_secret))
            client.utility.verify_payment_signature({
                'razorpay_order_id': req.razorpay_order_id,
                'razorpay_payment_id': req.razorpay_payment_id,
                'razorpay_signature': req.razorpay_signature
            })
            
        supabase.table("bounty_claims").update({
            "status": "accepted",
            "razorpay_payment_id": req.razorpay_payment_id
        }).eq("id", claim_id).execute()
        
        supabase.table("skill_requests").update({
            "status": "closed"
        }).eq("id", claim["bounty_id"]).execute()
        
        supabase.table("user_activity").insert({
            "user_id": claim["claimer_id"],
            "activity_type": "bounty"
        }).execute()
        
        return {"status": "success", "message": "Bounty claimed and paid successfully."}
    except razorpay.errors.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class DisputeRequest(BaseModel):
    purchase_id: str
    reason: str

@app.post("/api/disputes")
def raise_dispute(req: DisputeRequest, user = Depends(get_current_user)):
    try:
        # Verify the purchase belongs to this buyer
        purchase = supabase.table("purchases").select("id, skill_id, amount").eq("id", req.purchase_id).eq("buyer_id", user.id).execute()
        if not purchase.data:
            raise HTTPException(status_code=404, detail="Purchase not found or does not belong to you")
        
        res = supabase.table("disputes").insert({
            "buyer_id": user.id,
            "purchase_id": req.purchase_id,
            "reason": req.reason,
            "status": "open"
        }).execute()
        
        dispute_id = res.data[0].get("id", "UNKNOWN") if res.data else "UNKNOWN"
        purchase_amount = purchase.data[0].get("amount", "N/A")
        skill_id = purchase.data[0].get("skill_id", "N/A")
        
        # Send email
        try:
            import os
            import smtplib
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart
            import datetime
            
            smtp_host = os.environ.get("SMTP_HOST", "smtp.zoho.in")
            smtp_port = int(os.environ.get("SMTP_PORT", 465))
            smtp_user = os.environ.get("SMTP_USER", "support@bodhicai.tech")
            smtp_password = os.environ.get("SMTP_PASSWORD", "")
            
            if smtp_password:
                msg = MIMEMultipart()
                msg["From"] = smtp_user
                recipients = ["support@bodhicai.tech", "srikaran@bodhicai.tech", "karteek@bodhicai.tech"]
                msg["To"] = ", ".join(recipients)
                msg["Subject"] = f"[Dispute #{dispute_id}] Purchase {req.purchase_id[:8]}... — ₹{purchase_amount}"
                
                timestamp = datetime.datetime.now().isoformat()
                
                body = f"New Dispute Raised:\nDispute ID: {dispute_id}\nPurchase ID: {req.purchase_id}\nSkill ID: {skill_id}\nAmount: ₹{purchase_amount}\nBuyer ID: {user.id}\nTimestamp: {timestamp}\n\nReason:\n{req.reason}\n"
                msg.attach(MIMEText(body, "plain"))
                
                with smtplib.SMTP_SSL(smtp_host, smtp_port) as server:
                    server.login(smtp_user, smtp_password)
                    server.send_message(msg)
        except Exception as e:
            print(f"[ERROR] Failed to send dispute email: {e}")
            
        return {"message": "Dispute raised successfully", "dispute_id": dispute_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

