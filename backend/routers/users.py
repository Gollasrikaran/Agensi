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

class ProfileUpdateRequest(BaseModel):
    username: str
    avatar_url: str
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
            "avatar_url": req.avatar_url
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
