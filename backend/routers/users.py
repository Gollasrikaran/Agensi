from fastapi import APIRouter, HTTPException, Depends
from auth import get_current_user, supabase

router = APIRouter(prefix="/api/users", tags=["users"])

@router.get("/me/purchases")
def get_my_purchases(user = Depends(get_current_user)):
    try:
        # Fetch purchases for this user
        res = supabase.table("purchases").select("*, skills(title)").eq("buyer_id", user.id).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/me/skills")
def get_my_skills(user = Depends(get_current_user)):
    try:
        # Fetch skills sold/listed by this user
        res = supabase.table("skills").select("*").eq("seller_id", user.id).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from pydantic import BaseModel
from typing import Optional

class ProfileUpdateRequest(BaseModel):
    username: str
    avatar_url: str
    bio: Optional[str] = None
    background_url: str | None = None

@router.post("/me/profile")
def update_profile(req: ProfileUpdateRequest, user = Depends(get_current_user)):
    try:
        # Check if username is taken by someone else
        existing = supabase.table("users").select("id").eq("username", req.username).execute()
        if existing.data and existing.data[0]["id"] != user.id:
            raise HTTPException(status_code=400, detail="Username is already taken")
            
        update_data = {
            "username": req.username,
            "avatar_url": req.avatar_url,
            "bio": req.bio
        }
        if req.background_url is not None:
            update_data["background_url"] = req.background_url

        res = supabase.table("users").update(update_data).eq("id", user.id).execute()
        
        return {"message": "Profile updated successfully", "user": res.data[0] if res.data else None}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class AppealRequest(BaseModel):
    message: str

@router.post("/me/appeal")
def submit_appeal(req: AppealRequest, user = Depends(get_current_user)):
    try:
        # Check if user is actually blocked (this assumes the users table exists and has these columns)
        user_db = supabase.table("users").select("is_blocked").eq("id", user.id).execute()
        if not user_db.data or not user_db.data[0].get("is_blocked"):
            raise HTTPException(status_code=400, detail="User is not blocked, no appeal necessary.")
            
        res = supabase.table("users").update({
            "appeal_requested": True,
            "appeal_message": req.message
        }).eq("id", user.id).execute()
        
        return {"message": "Appeal submitted successfully. The admin will review your case."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class PayoutRequest(BaseModel):
    amount_inr: float
    upi_id: str

@router.get("/me/wallet")
def get_my_wallet(user = Depends(get_current_user)):
    try:
        wallet = supabase.table("seller_wallets").select("balance_inr").eq("user_id", user.id).execute()
        balance = wallet.data[0]["balance_inr"] if wallet.data else 0.0
        
        history = supabase.table("payout_requests").select("*").eq("seller_id", user.id).order("created_at", desc=True).execute()
        return {"balance_inr": balance, "history": history.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/me/payout")
def request_payout(req: PayoutRequest, user = Depends(get_current_user)):
    try:
        # Check balance
        wallet = supabase.table("seller_wallets").select("balance_inr").eq("user_id", user.id).execute()
        balance = float(wallet.data[0]["balance_inr"]) if wallet.data else 0.0
        
        if req.amount_inr > balance:
            raise HTTPException(status_code=400, detail="Insufficient balance")
            
        if req.amount_inr < 100:
            raise HTTPException(status_code=400, detail="Minimum payout is ₹100")
            
        # Deduct balance
        new_balance = balance - req.amount_inr
        supabase.table("seller_wallets").update({"balance_inr": new_balance}).eq("user_id", user.id).execute()
        
        # Create request
        supabase.table("payout_requests").insert({
            "seller_id": user.id,
            "amount_inr": req.amount_inr,
            "upi_id": req.upi_id,
            "status": "pending"
        }).execute()
        
        return {"message": "Payout requested successfully", "new_balance": new_balance}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class PinnedSkillsRequest(BaseModel):
    skill_ids: list[str]

@router.post("/me/pinned-skills")
def update_pinned_skills(req: PinnedSkillsRequest, user = Depends(get_current_user)):
    try:
        # 1. Validate max 3 skills
        if len(req.skill_ids) > 3:
            raise HTTPException(status_code=400, detail="You can only pin up to 3 skills")
            
        # 2. Verify user owns these skills
        if req.skill_ids:
            skills = supabase.table("skills").select("id").eq("seller_id", user.id).in_("id", req.skill_ids).execute()
            if len(skills.data) != len(req.skill_ids):
                raise HTTPException(status_code=400, detail="Invalid skill IDs or you do not own them")
                
        # 3. Delete existing pins
        supabase.table("pinned_skills").delete().eq("user_id", user.id).execute()
        
        # 4. Insert new pins
        if req.skill_ids:
            pins_to_insert = [
                {"user_id": user.id, "skill_id": skill_id, "pin_order": idx}
                for idx, skill_id in enumerate(req.skill_ids)
            ]
            supabase.table("pinned_skills").insert(pins_to_insert).execute()
            
        return {"message": "Pinned skills updated"}

class ReviewRequest(BaseModel):
    skill_id: str
    rating: int
    comment: str | None = None

@router.post("/me/reviews")
def submit_review(req: ReviewRequest, user = Depends(get_current_user)):
    try:
        if req.rating < 1 or req.rating > 5:
            raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
            
        # Verify purchase
        purchase = supabase.table("purchases").select("id").eq("buyer_id", user.id).eq("skill_id", req.skill_id).eq("payment_status", "completed").execute()
        if not purchase.data:
            raise HTTPException(status_code=403, detail="You can only review skills you have purchased")
            
        review_data = {
            "skill_id": req.skill_id,
            "buyer_id": user.id,
            "rating": req.rating,
            "comment": req.comment
        }
        
        # Upsert based on unique constraint
        res = supabase.table("reviews").upsert(review_data, on_conflict="skill_id,buyer_id").execute()
        return {"message": "Review submitted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/me/achievements")
def get_my_achievements(user = Depends(get_current_user)):
    try:
        # Fetch all possible achievements
        all_ach = supabase.table("achievements").select("*").execute()
        
        # Fetch user's unlocked achievements
        user_ach = supabase.table("user_achievements").select("*").eq("user_id", user.id).execute()
        unlocked_map = {a["achievement_id"]: a for a in user_ach.data}
        
        results = []
        for ach in all_ach.data:
            unlocked_data = unlocked_map.get(ach["id"])
            results.append({
                **ach,
                "is_unlocked": bool(unlocked_data),
                "is_public": unlocked_data["is_public"] if unlocked_data else False,
                "unlocked_at": unlocked_data["unlocked_at"] if unlocked_data else None
            })
            
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class PrivacyToggleRequest(BaseModel):
    is_public: bool

@router.patch("/me/achievements/{achievement_id}/privacy")
def toggle_achievement_privacy(achievement_id: str, req: PrivacyToggleRequest, user = Depends(get_current_user)):
    try:
        # Verify it's unlocked and not admin_awarded
        ach = supabase.table("achievements").select("is_admin_awarded").eq("id", achievement_id).execute()
        if not ach.data:
            raise HTTPException(status_code=404, detail="Achievement not found")
            
        if ach.data[0]["is_admin_awarded"] and not req.is_public:
            raise HTTPException(status_code=400, detail="Admin-awarded trust badges cannot be made private")
            
        res = supabase.table("user_achievements").update({"is_public": req.is_public}).eq("user_id", user.id).eq("achievement_id", achievement_id).execute()
        if not res.data:
            raise HTTPException(status_code=400, detail="Achievement not unlocked yet")
            
        return {"message": "Privacy updated", "is_public": req.is_public}
    except HTTPException:
        raise

# --- DEVELOPER & MCP ENDPOINTS ---

@router.get("/me/api_keys")
def get_api_keys(user = Depends(get_current_user)):
    try:
        res = supabase.table("user_api_keys").select("id, name, key_prefix, last_used_at, created_at").eq("user_id", user.id).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class CreateKeyRequest(BaseModel):
    name: str

@router.post("/me/api_keys")
def create_api_key(req: CreateKeyRequest, user = Depends(get_current_user)):
    try:
        import secrets, hashlib
        raw_key = "bodhic_" + secrets.token_urlsafe(32)
        key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
        key_prefix = raw_key[:12]
        
        res = supabase.table("user_api_keys").insert({
            "user_id": user.id,
            "api_key_hash": key_hash,
            "key_prefix": key_prefix,
            "name": req.name
        }).execute()
        
        return {"message": "Key created", "raw_key": raw_key, "key": res.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/me/api_keys/{key_id}")
def delete_api_key(key_id: str, user = Depends(get_current_user)):
    try:
        supabase.table("user_api_keys").delete().eq("id", key_id).eq("user_id", user.id).execute()
        return {"message": "Key deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- CREDITS ENDPOINTS ---

@router.get("/me/credits")
def get_credits(user = Depends(get_current_user)):
    try:
        res = supabase.table("user_credits").select("balance").eq("user_id", user.id).execute()
        return {"balance": res.data[0]["balance"] if res.data else 0}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class CreditTopupRequest(BaseModel):
    amount_inr: float

@router.post("/me/credits/checkout")
def checkout_credits(req: CreditTopupRequest, user = Depends(get_current_user)):
    try:
        from payments import create_payment_intent
        intent = create_payment_intent("IN", req.amount_inr) # Assume domestic INR
        return intent
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class CreditCheckoutSuccess(BaseModel):
    amount_inr: float
    razorpay_payment_id: str | None = None
    
@router.post("/me/credits/checkout/success")
def checkout_credits_success(req: CreditCheckoutSuccess, user = Depends(get_current_user)):
    try:
        # 1 INR = 10 Credits
        credits_to_add = int(req.amount_inr * 10)
        
        # Give bonus if >= 499
        if req.amount_inr >= 499:
            credits_to_add += 500
            
        credits_res = supabase.table("user_credits").select("balance").eq("user_id", user.id).execute()
        current_balance = credits_res.data[0]["balance"] if credits_res.data else 0
        new_balance = current_balance + credits_to_add
        
        if credits_res.data:
            supabase.table("user_credits").update({"balance": new_balance}).eq("user_id", user.id).execute()
        else:
            supabase.table("user_credits").insert({"user_id": user.id, "balance": new_balance}).execute()
            
        supabase.table("credit_transactions").insert({
            "user_id": user.id,
            "amount": credits_to_add,
            "transaction_type": "top_up",
            "reference_id": req.razorpay_payment_id or "mock",
            "description": f"Topped up {credits_to_add} credits"
        }).execute()
        
        return {"message": "Credits added successfully", "new_balance": new_balance}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
