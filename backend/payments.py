from typing import Dict, Any

# Payment routing logic with Paypal mock
def get_payment_provider(country_code: str) -> str:
    """
    Determine payment provider based on country code.
    Since we are using Paypal instead of Stripe for the first draft,
    Paypal is used for most generic routes or we fall back to it.
    """
    mapping = {
        "IN": "Razorpay",
        "NG": "Paystack",
        "BR": "Mercado Pago",
        "MX": "Mercado Pago",
        "AR": "Mercado Pago"
    }
    # For US, UK, EU and others we use PayPal as requested instead of Stripe
    return mapping.get(country_code, "PayPal")

def create_payment_intent(country_code: str, amount_usd: float) -> Dict[str, Any]:
    """
    Create a mock payment intent.
    """
    provider = get_payment_provider(country_code)
    
    # Mock dynamic pricing
    exchange_rates = {
        "IN": {"currency": "INR", "rate": 83.0},
        "NG": {"currency": "NGN", "rate": 1500.0},
        "BR": {"currency": "BRL", "rate": 5.0},
        "US": {"currency": "USD", "rate": 1.0},
        "UK": {"currency": "GBP", "rate": 0.78},
    }
    
    rate_info = exchange_rates.get(country_code, {"currency": "USD", "rate": 1.0})
    local_amount = amount_usd * rate_info["rate"]
    
    return {
        "provider": provider,
        "amount": round(local_amount, 2),
        "currency": rate_info["currency"],
        "client_secret": f"mock_secret_{provider}_{int(local_amount)}",
        "status": "requires_payment_method"
    }
