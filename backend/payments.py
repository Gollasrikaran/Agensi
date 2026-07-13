from typing import Dict, Any

# Payment routing logic with Paypal/Razorpay mock
def get_payment_provider(country_code: str) -> str:
    """
    Determine payment provider based on country code.
    Since we are using manual ledger, we use UPI/Razorpay mock for India and PayPal for others.
    """
    mapping = {
        "IN": "Razorpay",
    }
    return mapping.get(country_code, "PayPal")

def create_payment_intent(country_code: str, amount_inr: float) -> Dict[str, Any]:
    """
    Create a mock payment intent in INR.
    """
    provider = get_payment_provider(country_code)
    
    # 80/20 Split Calculation
    platform_fee = round(amount_inr * 0.20, 2)
    seller_amount = round(amount_inr * 0.80, 2)
    
    return {
        "provider": provider,
        "amount_inr": round(amount_inr, 2),
        "platform_fee_inr": platform_fee,
        "seller_amount_inr": seller_amount,
        "currency": "INR",
        "client_secret": f"mock_secret_{provider}_{int(amount_inr)}",
        "status": "requires_payment_method"
    }

