from typing import Dict, Any
import os
import razorpay

# Payment routing logic with Paypal/Razorpay mock
def get_payment_provider(country_code: str) -> str:
    """
    Determine payment provider based on country code.
    """
    mapping = {
        "IN": "Razorpay",
    }
    return mapping.get(country_code, "PayPal")

def create_payment_intent(country_code: str, amount_inr: float) -> Dict[str, Any]:
    """
    Create a payment intent in INR. Uses real Razorpay if keys are present,
    otherwise falls back to a mock intent.
    """
    provider = get_payment_provider(country_code)
    
    # 80/20 Split Calculation
    platform_fee = round(amount_inr * 0.20, 2)
    seller_amount = round(amount_inr * 0.80, 2)
    
    amount_paise = int(round(amount_inr * 100))
    
    razorpay_key_id = os.environ.get("RAZORPAY_KEY_ID")
    razorpay_key_secret = os.environ.get("RAZORPAY_KEY_SECRET")
    
    client_secret = f"mock_secret_{provider}_{int(amount_inr)}"
    is_live = False
    
    if provider == "Razorpay" and razorpay_key_id and razorpay_key_secret:
        try:
            client = razorpay.Client(auth=(razorpay_key_id, razorpay_key_secret))
            order = client.order.create({
                "amount": amount_paise,
                "currency": "INR",
                "payment_capture": "1"
            })
            client_secret = order["id"]
            is_live = True
        except Exception as e:
            print(f"Razorpay Order Creation Failed: {e}")
    
    return {
        "provider": provider,
        "amount_inr": round(amount_inr, 2),
        "platform_fee_inr": platform_fee,
        "seller_amount_inr": seller_amount,
        "currency": "INR",
        "client_secret": client_secret,
        "is_live": is_live,
        "razorpay_key_id": razorpay_key_id if is_live else None,
        "status": "requires_payment_method"
    }
