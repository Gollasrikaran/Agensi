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

@router.post("/me/profile")
def update_profile(req: ProfileUpdateRequest, user = Depends(get_current_user)):
    try:
        # Check if username is taken by someone else
        existing = supabase.table("users").select("id").eq("username", req.username).execute()
        if existing.data and existing.data[0]["id"] != user.id:
            raise HTTPException(status_code=400, detail="Username is already taken")
            
        res = supabase.table("users").update({
            "username": req.username,
            "avatar_url": req.avatar_url,
            "bio": req.bio
        }).eq("id", user.id).execute()
        
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
