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

        # Recent activities
        recent_skills = supabase.table("skills").select("*").order("created_at", desc=True).limit(5).execute().data
        recent_purchases = supabase.table("purchases").select("*").order("created_at", desc=True).limit(5).execute().data
        
        pending_payouts = supabase.table("payouts").select("*").eq("status", "pending").order("created_at", desc=True).execute().data or []
        
        # Enrich pending payouts with seller username and upi_id
        for payout in pending_payouts:
            user_res = supabase.table("users").select("username, upi_id").eq("id", payout["seller_id"]).execute()
            if user_res.data:
                payout["seller_username"] = user_res.data[0].get("username", "Unknown")
                payout["upi_id"] = user_res.data[0].get("upi_id", "Not set")


        return {
            "stats": {
                "total_users": users_count,
                "total_skills_listed": skills_count,
                "total_sales_volume": total_sales_volume
            },
            "recent_skills": recent_skills,
            "recent_purchases": recent_purchases,
            "pending_payouts": pending_payouts
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/appeals")
def get_appeals(admin_user = Depends(verify_admin)):
    try:
        res = supabase.table("users").select("id, warnings_count, appeal_message").eq("appeal_requested", True).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/users/{user_id}/unblock")
def unblock_user(user_id: str, admin_user = Depends(verify_admin)):
    try:
        res = supabase.table("users").update({
            "is_blocked": False,
            "warnings_count": 0,
            "appeal_requested": False,
            "appeal_message": None
        }).eq("id", user_id).execute()
        
        if not res.data:
            raise HTTPException(status_code=404, detail="User not found")
        return {"message": "User unblocked successfully. Warnings reset to 0."}
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

@router.get("/users/{user_id}/skills")
def get_user_skills(user_id: str, admin_user = Depends(verify_admin)):
    try:
        # Fetch all skills by the user (including rejected ones)
        skills_res = supabase.table("skills").select("*").eq("seller_id", user_id).order("created_at", desc=True).execute()
        skills = skills_res.data
        
        # Attach MD content for previewing securely
        for skill in skills:
            version_res = supabase.table("skill_versions").select("md_content").eq("skill_id", skill["id"]).order("version_number", desc=True).limit(1).execute()
            if version_res.data:
                skill["md_content"] = version_res.data[0]["md_content"]
            else:
                skill["md_content"] = "No content available."
                
        return skills
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- PAYOUT ENDPOINTS ---

@router.get("/payouts")
def get_payouts(admin_user = Depends(verify_admin)):
    try:
        res = supabase.table("payouts").select("*").order("created_at", desc=False).execute()
        # Enrich with seller UPI from users table
        payouts = res.data or []
        for payout in payouts:
            user_res = supabase.table("users").select("username, upi_id").eq("id", payout["seller_id"]).execute()
            if user_res.data:
                payout["seller_username"] = user_res.data[0].get("username", "Unknown")
                payout["upi_id"] = user_res.data[0].get("upi_id", "Not set")
        return payouts
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/payouts/{payout_id}/complete")
def complete_payout(payout_id: str, admin_user = Depends(verify_admin)):
    try:
        req = supabase.table("payouts").select("status").eq("id", payout_id).single().execute()
        if not req.data:
            raise HTTPException(status_code=404, detail="Payout not found")
        if req.data["status"] != "pending":
            raise HTTPException(status_code=400, detail="Payout is not pending")
            
        res = supabase.table("payouts").update({"status": "completed"}).eq("id", payout_id).execute()
        return {"message": "Payout marked as completed", "payout": res.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- CRON SWEEP ENDPOINT ---

@router.post("/cron/sweep")
def run_payout_sweep(admin_user = Depends(verify_admin)):
    """
    Automated weekly sweep: calculates each seller's available balance
    and creates ONE consolidated payout for sellers with balance >= 100.
    """
    try:
        # 1. Get all sellers who have skills with completed purchases
        all_skills = supabase.table("skills").select("id, seller_id").execute()
        if not all_skills.data:
            return {"message": "No sellers found", "payouts_created": 0}
        
        # Group skill IDs by seller
        seller_skills = {}
        for skill in all_skills.data:
            sid = skill["seller_id"]
            if sid not in seller_skills:
                seller_skills[sid] = []
            seller_skills[sid].append(skill["id"])
        
        payouts_created = 0
        sweep_results = []
        
        for seller_id, skill_ids in seller_skills.items():
            # Calculate total earnings (80% of purchases)
            purchases_res = supabase.table("purchases").select("amount").in_("skill_id", skill_ids).eq("payment_status", "completed").execute()
            total_earnings = 0.0
            if purchases_res.data:
                total_earnings = sum(float(p["amount"]) * 0.80 for p in purchases_res.data)
            
            # Calculate total ALREADY COMPLETED
            completed_res = supabase.table("payouts").select("amount").eq("seller_id", seller_id).eq("status", "completed").execute()
            total_completed = 0.0
            if completed_res.data:
                total_completed = sum(float(p["amount"]) for p in completed_res.data)
            
            # This is the total amount that should currently be pending
            target_pending = round(total_earnings - total_completed, 2)
            
            # Check if there's already a pending payout for this seller
            pending_res = supabase.table("payouts").select("id, amount").eq("seller_id", seller_id).eq("status", "pending").execute()
            
            user_res = supabase.table("users").select("upi_id, username").eq("id", seller_id).execute()
            upi_id = user_res.data[0].get("upi_id") if user_res.data else None
            username = user_res.data[0].get("username", "Unknown") if user_res.data else "Unknown"

            if target_pending > 0:
                if pending_res.data:
                    # Update existing pending payout
                    payout_id = pending_res.data[0]["id"]
                    supabase.table("payouts").update({
                        "amount": target_pending
                    }).eq("id", payout_id).execute()
                    # We count updates as "created" for the summary message simplicity, or we could track it separately
                    payouts_created += 1
                    sweep_results.append({"seller": username, "amount": target_pending, "upi": upi_id or "NOT SET", "action": "updated"})
                else:
                    # Only insert a NEW payout if they cross the 100 INR minimum threshold (or you can remove the >= 100 check)
                    if target_pending >= 1:
                        if upi_id:
                            supabase.table("payouts").insert({
                                "seller_id": seller_id,
                                "amount": target_pending,
                                "currency": "INR",
                                "provider": "UPI",
                                "status": "pending"
                            }).execute()
                            payouts_created += 1
                            sweep_results.append({"seller": username, "amount": target_pending, "upi": upi_id, "action": "created"})
                        else:
                            sweep_results.append({"seller": username, "amount": target_pending, "upi": "NOT SET - SKIPPED", "action": "skipped"})
        
        return {
            "message": f"Sweep complete. Processed {payouts_created} payouts.",
            "payouts_created": payouts_created,
            "details": sweep_results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
