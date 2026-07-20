import json
import httpx
import os
from auth import supabase

# Import FastMCP
from fastmcp import FastMCP

# Initialize FastMCP Server
mcp = FastMCP("Bodhic-MCP")

@mcp.tool()
def search_skills(query: str) -> str:
    """Search the Bodhic AI marketplace for available skills."""
    res = supabase.table("skills").select("id, title, description, category, base_price_inr").ilike("title", f"%{query}%").eq("moderation_status", "approved").limit(5).execute()
    return json.dumps(res.data, indent=2)

@mcp.tool()
def get_credit_balance(api_key: str) -> str:
    """Check the user's Bodhic Credit balance. You must provide the user's Bodhic API Key."""
    # Authenticate
    res = supabase.table("user_api_keys").select("user_id").eq("api_key_hash", api_key).execute()
    if not res.data:
        return "Error: Invalid API Key"
    
    user_id = res.data[0]["user_id"]
    res_credits = supabase.table("user_credits").select("balance").eq("user_id", user_id).execute()
    balance = res_credits.data[0]["balance"] if res_credits.data else 0
    return f"You have {balance} Bodhic Credits remaining."

@mcp.tool()
async def chat_with_skill(api_key: str, skill_id: str, message: str) -> str:
    """Send a message to a specific skill. Checks if the user purchased it or deducts 10 credits. Requires the user's Bodhic API Key."""
    # Authenticate
    res = supabase.table("user_api_keys").select("user_id").eq("api_key_hash", api_key).execute()
    if not res.data:
        return "Error: Invalid API Key"
    user_id = res.data[0]["user_id"]
    
    # Update last_used_at
    supabase.table("user_api_keys").update({"last_used_at": "now()"}).eq("api_key_hash", api_key).execute()
    
    # 1. Fetch Skill Info & Secret Prompt
    skill_res = supabase.table("skills").select("title, prompt_template").eq("id", skill_id).execute()
    if not skill_res.data:
        return "Error: Skill not found."
    skill = skill_res.data[0]
    
    # 2. Check if user purchased the skill outright
    purchase_res = supabase.table("purchases").select("id").eq("buyer_id", user_id).eq("skill_id", skill_id).eq("payment_status", "completed").execute()
    has_purchased = len(purchase_res.data) > 0
    
    if not has_purchased:
        # 3. Check credits and deduct 10
        credits_res = supabase.table("user_credits").select("balance").eq("user_id", user_id).execute()
        balance = credits_res.data[0]["balance"] if credits_res.data else 0
        
        if balance < 10:
            return f"You are out of credits ({balance} remaining, 10 required). Please recharge your Bodhic Credits or Buy the skill outright at https://bodhic.app/skill/{skill_id}"
        
        # Deduct credits
        supabase.table("user_credits").update({"balance": balance - 10}).eq("user_id", user_id).execute()
        
        # Log transaction
        supabase.table("credit_transactions").insert({
            "user_id": user_id,
            "amount": -10,
            "transaction_type": "mcp_purchase",
            "reference_id": skill_id,
            "description": f"Chat with {skill['title']}"
        }).execute()
        
    # 4. Call Cloudflare Workers AI
    cf_account_id = os.environ.get("CLOUDFLARE_MCP_ACCOUNT_ID")
    cf_api_token = os.environ.get("CLOUDFLARE_MCP_API_TOKEN")
    
    if not cf_account_id or not cf_api_token:
        return "Error: Cloudflare MCP credentials not configured on the server."
        
    cf_url = f"https://api.cloudflare.com/client/v4/accounts/{cf_account_id}/ai/run/@cf/meta/llama-3-8b-instruct"
    
    payload = {
        "messages": [
            {"role": "system", "content": skill["prompt_template"] or "You are a helpful AI assistant."},
            {"role": "user", "content": message}
        ]
    }
    
    async with httpx.AsyncClient() as client:
        ai_resp = await client.post(cf_url, headers={"Authorization": f"Bearer {cf_api_token}"}, json=payload, timeout=30.0)
        
        if ai_resp.is_success:
            return ai_resp.json().get("result", {}).get("response", "No response from AI.")
        else:
            return f"AI Error: {ai_resp.text}"
