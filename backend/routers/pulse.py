from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from auth import supabase

router = APIRouter(prefix="/api/pulse", tags=["pulse"])

@router.get("/user/{username}")
def get_user_pulse(username: str, months: int = Query(12, ge=1, le=12)):
    try:
        # Resolve username to user_id
        user_res = supabase.table("users").select("id, is_private").eq("username", username).execute()
        if not user_res.data:
            raise HTTPException(status_code=404, detail="User not found")
        if user_res.data[0].get("is_private"):
            raise HTTPException(status_code=403, detail="This profile is private")
        user_id = user_res.data[0]["id"]
        
        # Get pulse scores
        scores_res = supabase.table("user_pulse_scores").select("*").eq("user_id", user_id).execute()
        
        # Fetch actual activity (Mocking for now, in reality aggregate from user_activity)
        # Assuming user_activity has date and activity_type
        # We would group by date and count activity types
        activity_res = supabase.table("user_activity").select("*").eq("user_id", user_id).execute()
        
        # Process into cells
        # This is a simplified aggregate just returning raw activities to frontend
        # In a real app we'd map this out over the 364 day grid
        
        return {
            "username": username,
            "pulse_scores": scores_res.data,
            "raw_activities": activity_res.data,
            "streak": {"current": 0, "longest": 0}, # Would be joined from user_streaks
            "total_activities": len(activity_res.data)
        }
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/compare/{username1}/{username2}")
def compare_pulses(username1: str, username2: str):
    try:
        user1 = get_user_pulse(username1)
        user2 = get_user_pulse(username2)
        return {
            "user1": user1,
            "user2": user2
        }
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))
