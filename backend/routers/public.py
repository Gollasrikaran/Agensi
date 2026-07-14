from fastapi import APIRouter, HTTPException
from auth import supabase

router = APIRouter(prefix="/api/public", tags=["public"])

@router.get("/skills")
def get_public_skills():
    try:
        # Fetch approved skills and join with the users table to get seller profile info
        res = supabase.table("skills") \
            .select("*, seller:seller_id(username, avatar_url)") \
            .eq("moderation_status", "approved") \
            .order("published_at", desc=True) \
            .execute()
        
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
