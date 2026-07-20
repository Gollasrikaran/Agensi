from fastapi import APIRouter, HTTPException
from auth import supabase

router = APIRouter(prefix="/api/public", tags=["public"])

@router.get("/skills")
def get_public_skills():
    try:
        # Fetch approved skills and join with the users table to get seller profile info
        res = supabase.table("skills") \
            .select("*, seller:seller_id(username, avatar_url, background_url)") \
            .eq("moderation_status", "approved") \
            .order("published_at", desc=True) \
            .execute()
        
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/profile/{username}")
def get_public_profile(username: str):
    try:
        # Fetch user details
        user_res = supabase.table("users") \
            .select("id, username, avatar_url, background_url, created_at") \
            .eq("username", username) \
            .single() \
            .execute()
            
        if not user_res.data:
            raise HTTPException(status_code=404, detail="User not found")
            
        seller = user_res.data
        
        # Fetch seller's approved skills
        skills_res = supabase.table("skills") \
            .select("*") \
            .eq("seller_id", seller["id"]) \
            .eq("moderation_status", "approved") \
            .order("published_at", desc=True) \
            .execute()
            
        # Optional: Fetch seller stats (total sales, etc.) could be added here if needed
        
        return {
            "seller": seller,
            "skills": skills_res.data or []
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users")
def get_public_users():
    try:
        # Fetch all usernames for SSG getStaticPaths
        res = supabase.table("users").select("username").not_.is_("username", "null").execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
