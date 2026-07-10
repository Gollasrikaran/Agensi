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
