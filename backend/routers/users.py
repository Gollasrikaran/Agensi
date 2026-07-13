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
