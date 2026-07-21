from fastapi import APIRouter, HTTPException
from auth import supabase

router = APIRouter(prefix="/api/public", tags=["public"])

@router.get("/skills")
def get_public_skills():
    try:
        # Fetch approved skills and join with the users table and reviews
        res = supabase.table("skills") \
            .select("*, seller:seller_id(username, avatar_url, background_url), reviews(rating)") \
            .eq("moderation_status", "approved") \
            .order("published_at", desc=True) \
            .execute()
        
        # Calculate average rating for each skill
        skills = res.data
        for skill in skills:
            if "reviews" in skill and skill["reviews"]:
                ratings = [r["rating"] for r in skill["reviews"] if r.get("rating")]
                skill["rating"] = round(sum(ratings) / len(ratings), 1) if ratings else None
            else:
                skill["rating"] = None
        
        return skills
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/profile/{username}")
def get_public_profile(username: str):
    try:
        # Fetch user details
        user_res = supabase.table("users") \
            .select("id, username, avatar_url, background_url, created_at, bio, is_private") \
            .eq("username", username) \
            .single() \
            .execute()
            
        if not user_res.data:
            raise HTTPException(status_code=404, detail="User not found")
            
        seller = user_res.data
        # We still return the profile if it's private, so the frontend can display uploaded skills but mask achievements.
        
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

@router.get("/search")
def search_skills(q: str):
    try:
        # ILIKE search on title or description
        res = supabase.table("skills") \
            .select("*, seller:seller_id(username, avatar_url, background_url), reviews(rating)") \
            .eq("moderation_status", "approved") \
            .or_(f"title.ilike.%{q}%,description.ilike.%{q}%") \
            .order("published_at", desc=True) \
            .execute()
            
        skills = res.data
        for skill in skills:
            if "reviews" in skill and skill["reviews"]:
                ratings = [r["rating"] for r in skill["reviews"] if r.get("rating")]
                skill["rating"] = round(sum(ratings) / len(ratings), 1) if ratings else None
            else:
                skill["rating"] = None
        
        return skills
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from pydantic import BaseModel
class VoteRequest(BaseModel):
    type: str # "upvote" or "downvote"

@router.post("/skills/{skill_id}/vote")
def vote_skill(skill_id: str, req: VoteRequest):
    try:
        # In a real app we'd get current_user and prevent multiple votes. 
        # For pilot, we just increment the counter.
        skill_res = supabase.table("skills").select("upvotes, downvotes").eq("id", skill_id).single().execute()
        if not skill_res.data:
            raise HTTPException(status_code=404, detail="Skill not found")
            
        skill = skill_res.data
        upvotes = skill.get("upvotes") or 0
        downvotes = skill.get("downvotes") or 0
        
        if req.type == "upvote":
            upvotes += 1
        elif req.type == "downvote":
            downvotes += 1
            
        supabase.table("skills").update({
            "upvotes": upvotes,
            "downvotes": downvotes
        }).eq("id", skill_id).execute()
        
        return {"status": "success", "upvotes": upvotes, "downvotes": downvotes}
    except Exception as e:
        if isinstance(e, HTTPException): raise
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/users/{username}/profile")
def get_user_profile(username: str):
    try:
        user_res = supabase.table("users").select("id, username, avatar_url, bio, created_at").eq("username", username).execute()
        if not user_res.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_data = user_res.data[0]
        user_id = user_data["id"]
        
        # Aggregate stats
        # Total skills
        skills_res = supabase.table("skills").select("id, upvotes, purchase_count", count="exact").eq("seller_id", user_id).eq("moderation_status", "approved").execute()
        
        total_skills = skills_res.count if skills_res.count else 0
        total_upvotes = sum((s.get("upvotes") or 0) for s in skills_res.data)
        total_downloads = sum((s.get("purchase_count") or 0) for s in skills_res.data)
        
        # Tier Calculation
        score = (total_skills * 10) + (total_downloads * 5) + (total_upvotes * 1)
        tier = "Novice"
        if score >= 5000: tier = "Legend"
        elif score >= 1000: tier = "Elite"
        elif score >= 250: tier = "Verified"
        elif score >= 50: tier = "Builder"
        
        user_data["stats"] = {
            "total_skills": total_skills,
            "total_upvotes": total_upvotes,
            "total_downloads": total_downloads,
            "tier": tier,
            "score": score
        }
        
        # Fetch pinned skills
        pinned_res = supabase.table("pinned_skills") \
            .select("pin_order, skills(*)") \
            .eq("user_id", user_id) \
            .order("pin_order") \
            .execute()
        
        user_data["pinned_skills"] = [p["skills"] for p in pinned_res.data if p.get("skills")]
        
        # Fetch public achievements
        achievements_res = supabase.table("user_achievements") \
            .select("unlocked_at, achievements(*)") \
            .eq("user_id", user_id) \
            .eq("is_public", True) \
            .order("unlocked_at", desc=True) \
            .execute()
            
        user_data["achievements"] = [
            {**a["achievements"], "unlocked_at": a["unlocked_at"]} 
            for a in achievements_res.data if a.get("achievements")
        ]
        
        return user_data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users/{username}/activity")
def get_user_activity(username: str):
    try:
        user_res = supabase.table("users").select("id").eq("username", username).execute()
        if not user_res.data:
            raise HTTPException(status_code=404, detail="User not found")
            
        user_id = user_res.data[0]["id"]
        
        # Fetch last 365 days of activity
        # Note: In real app we'd group by day. Here we just fetch and group in python
        # or we can just fetch raw rows if not too many. Let's fetch all and group by date.
        activity_res = supabase.table("user_activity").select("created_at, activity_type").eq("user_id", user_id).execute()
        
        # Also fetch streak info
        streak_res = supabase.table("user_streaks").select("*").eq("user_id", user_id).execute()
        
        return {
            "activity": activity_res.data,
            "streaks": streak_res.data[0] if streak_res.data else {
                "current_streak": 0,
                "longest_streak": 0,
                "frozen_days_available": 0
            }
        }
    except HTTPException:
        raise

@router.get("/skills/{skill_id}/reviews")
def get_skill_reviews(skill_id: str):
    try:
        # Fetch reviews and join with users table to get buyer's public profile info
        res = supabase.table("reviews") \
            .select("rating, comment, created_at, buyer:buyer_id(username, avatar_url)") \
            .eq("skill_id", skill_id) \
            .order("created_at", desc=True) \
            .execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
