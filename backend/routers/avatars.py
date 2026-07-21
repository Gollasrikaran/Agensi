from fastapi import APIRouter, HTTPException, Depends
from auth import get_current_user, supabase

router = APIRouter(prefix="/api/avatars", tags=["avatars"])

@router.get("/packs")
def get_avatar_packs():
    try:
        res = supabase.table("avatar_packs").select("*, avatar_items(count)").eq("is_active", True).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/packs/{slug}")
def get_avatar_pack_details(slug: str):
    try:
        pack_res = supabase.table("avatar_packs").select("*").eq("slug", slug).execute()
        if not pack_res.data:
            raise HTTPException(status_code=404, detail="Pack not found")
        pack = pack_res.data[0]
        
        items_res = supabase.table("avatar_items").select("*").eq("pack_id", pack["id"]).order("sort_order").execute()
        pack["items"] = items_res.data
        return pack
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/my-unlocks")
def get_my_unlocks(user=Depends(get_current_user)):
    try:
        res = supabase.table("user_avatar_unlocks").select("pack_id, avatar_packs(*)").eq("user_id", user["id"]).execute()
        return [item["avatar_packs"] for item in res.data if item.get("avatar_packs")]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from payments import create_payment_intent
import os
import razorpay
from pydantic import BaseModel

class VerifyPaymentRequest(BaseModel):
    razorpay_payment_id: str
    razorpay_order_id: str
    razorpay_signature: str

@router.post("/packs/{slug}/order")
def create_avatar_pack_order(slug: str, user=Depends(get_current_user)):
    try:
        pack_res = supabase.table("avatar_packs").select("*").eq("slug", slug).execute()
        if not pack_res.data:
            raise HTTPException(status_code=404, detail="Pack not found")
        pack = pack_res.data[0]
        
        if pack["price_inr"] <= 0:
            return {"status": "success", "is_free": True}
            
        intent = create_payment_intent("IN", float(pack["price_inr"]))
        
        return intent
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/packs/{slug}/verify")
def verify_avatar_pack_payment(slug: str, req: VerifyPaymentRequest, user=Depends(get_current_user)):
    try:
        pack_res = supabase.table("avatar_packs").select("*").eq("slug", slug).execute()
        if not pack_res.data:
            raise HTTPException(status_code=404, detail="Pack not found")
        pack = pack_res.data[0]
        
        razorpay_key_secret = os.environ.get("RAZORPAY_KEY_SECRET")
        if razorpay_key_secret:
            client = razorpay.Client(auth=(os.environ.get("RAZORPAY_KEY_ID"), razorpay_key_secret))
            client.utility.verify_payment_signature({
                'razorpay_order_id': req.razorpay_order_id,
                'razorpay_payment_id': req.razorpay_payment_id,
                'razorpay_signature': req.razorpay_signature
            })
            
        supabase.table("user_avatar_unlocks").insert({
            "user_id": user["id"],
            "pack_id": pack["id"]
        }).execute()
        
        return {"status": "success", "message": f"Unlocked pack {pack['name']}"}
    except razorpay.errors.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
