from fastapi import APIRouter, HTTPException, Depends
from auth import get_current_user, supabase

router = APIRouter(prefix="/api/admin", tags=["admin"])

def verify_admin(user = Depends(get_current_user)):
    try:
        # Check if user is in admins table
        res = supabase.table("admins").select("id").eq("id", user.id).single().execute()
        if not res.data:
            raise HTTPException(status_code=403, detail="Not authorized as admin")
        return user
    except Exception:
        raise HTTPException(status_code=403, detail="Not authorized as admin")

@router.get("/dashboard")
def get_admin_dashboard_data(admin_user = Depends(verify_admin)):
    try:
        # Fetch high-level stats for the admin dashboard
        users_count = supabase.table("users").select("id", count="exact").execute().count
        skills_count = supabase.table("skills").select("id", count="exact").execute().count
        purchases_res = supabase.table("purchases").select("amount").execute()
        
        total_sales_volume = sum(p["amount"] for p in purchases_res.data) if purchases_res.data else 0

        # Recent activities (mocked complex joins by just fetching raw tables for simplicity)
        recent_skills = supabase.table("skills").select("*").order("created_at", desc=True).limit(5).execute().data
        recent_purchases = supabase.table("purchases").select("*").order("created_at", desc=True).limit(5).execute().data

        return {
            "stats": {
                "total_users": users_count,
                "total_skills_listed": skills_count,
                "total_sales_volume": total_sales_volume
            },
            "recent_skills": recent_skills,
            "recent_purchases": recent_purchases
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from pydantic import BaseModel

class StatusUpdateRequest(BaseModel):
    status: str

@router.post("/skills/{skill_id}/status")
def update_skill_status(skill_id: str, req: StatusUpdateRequest, admin_user = Depends(verify_admin)):
    if req.status not in ["approved", "rejected", "pending"]:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    try:
        res = supabase.table("skills").update({"moderation_status": req.status}).eq("id", skill_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Skill not found")
        return {"message": f"Skill status updated to {req.status}", "skill": res.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
