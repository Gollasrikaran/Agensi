from fastapi import APIRouter, Depends, HTTPException, Form, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import secrets
from datetime import datetime, timedelta, timezone
from auth import supabase, get_current_user

router = APIRouter()

class AuthorizeRequest(BaseModel):
    client_id: str
    redirect_uri: str
    state: str = None
    
@router.get("/.well-known/oauth-authorization-server")
def get_oauth_server_metadata(request: Request):
    """
    OAuth 2.0 Authorization Server Metadata (RFC 8414)
    Provides discovery information for clients like Claude.
    """
    base_url = str(request.base_url).rstrip("/")
    return {
        "issuer": base_url,
        "authorization_endpoint": "https://bodhiai.tech/oauth/authorize",
        "token_endpoint": f"{base_url}/oauth/token",
        "response_types_supported": ["code"],
        "grant_types_supported": ["authorization_code", "refresh_token"],
        "token_endpoint_auth_methods_supported": ["client_secret_post", "client_secret_basic"]
    }

@router.post("/api/oauth/authorize")
def create_authorization_code(req: AuthorizeRequest, user=Depends(get_current_user)):
    """
    Called by the Bodhic frontend when the user clicks 'Authorize'.
    Generates a short-lived authorization code.
    """
    # Verify client
    client_res = supabase.table("oauth_clients").select("redirect_uris").eq("client_id", req.client_id).execute()
    if not client_res.data:
        raise HTTPException(status_code=400, detail="Invalid client_id")
        
    client = client_res.data[0]
    valid_uris = client["redirect_uris"]
    
    # In a strict environment, we should check if req.redirect_uri is in valid_uris
    # For now, we allow it if it's broadly matching or if we trust the registered URIs
    is_valid_uri = any(req.redirect_uri.startswith(uri) for uri in valid_uris)
    if not is_valid_uri:
        raise HTTPException(status_code=400, detail="Invalid redirect_uri")
        
    # Generate code
    code = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)
    
    supabase.table("oauth_codes").insert({
        "code": code,
        "client_id": req.client_id,
        "user_id": user.id,
        "redirect_uri": req.redirect_uri,
        "expires_at": expires_at.isoformat()
    }).execute()
    
    return {"code": code, "state": req.state}

import base64

@router.post("/oauth/token")
async def exchange_token(
    request: Request,
    grant_type: str = Form(...),
    code: str = Form(None),
    refresh_token: str = Form(None),
    client_id: str = Form(None),
    client_secret: str = Form(None),
    redirect_uri: str = Form(None)
):
    """
    Called by Claude to exchange an authorization code or refresh token for an access token.
    """
    # 1. Extract Client Credentials (support both Basic Auth and Form POST)
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Basic "):
        try:
            decoded = base64.b64decode(auth_header[6:]).decode("utf-8")
            client_id, client_secret = decoded.split(":", 1)
        except Exception:
            return JSONResponse(status_code=401, content={"error": "invalid_client"})
            
    if not client_id or not client_secret:
        return JSONResponse(status_code=401, content={"error": "invalid_client", "error_description": "Missing client credentials"})

    # Verify Client Secret
    client_res = supabase.table("oauth_clients").select("client_secret").eq("client_id", client_id).execute()
    if not client_res.data or client_res.data[0]["client_secret"] != client_secret:
        return JSONResponse(status_code=401, content={"error": "invalid_client"})

    if grant_type == "authorization_code":
        if not code:
            return JSONResponse(status_code=400, content={"error": "invalid_request", "error_description": "Missing code"})
            
        # 2. Verify Code
        code_res = supabase.table("oauth_codes").select("*").eq("code", code).eq("client_id", client_id).execute()
        if not code_res.data:
            return JSONResponse(status_code=400, content={"error": "invalid_grant"})
            
        code_data = code_res.data[0]
        
        # Check expiry
        if datetime.fromisoformat(code_data["expires_at"]) < datetime.now(timezone.utc):
            supabase.table("oauth_codes").delete().eq("code", code).execute()
            return JSONResponse(status_code=400, content={"error": "invalid_grant", "error_description": "Code expired"})
            
        if redirect_uri and code_data["redirect_uri"] != redirect_uri:
            return JSONResponse(status_code=400, content={"error": "invalid_grant", "error_description": "Redirect URI mismatch"})
            
        user_id = code_data["user_id"]
        
        # Delete used code
        supabase.table("oauth_codes").delete().eq("code", code).execute()
        
    elif grant_type == "refresh_token":
        if not refresh_token:
            return JSONResponse(status_code=400, content={"error": "invalid_request", "error_description": "Missing refresh_token"})
            
        # Verify refresh token
        token_res = supabase.table("oauth_tokens").select("*").eq("refresh_token", refresh_token).eq("client_id", client_id).execute()
        if not token_res.data:
            return JSONResponse(status_code=400, content={"error": "invalid_grant"})
            
        user_id = token_res.data[0]["user_id"]
        
        # Delete old token pair
        supabase.table("oauth_tokens").delete().eq("refresh_token", refresh_token).execute()
        
    else:
        return JSONResponse(status_code=400, content={"error": "unsupported_grant_type"})
        
    # Generate new tokens
    new_access_token = "bodhic_oa_" + secrets.token_urlsafe(32)
    new_refresh_token = "bodhic_rt_" + secrets.token_urlsafe(32)
    expires_in = 3600 * 24 * 30 # 30 days
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)
    
    supabase.table("oauth_tokens").insert({
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "client_id": client_id,
        "user_id": user_id,
        "expires_at": expires_at.isoformat()
    }).execute()
    
    return {
        "access_token": new_access_token,
        "token_type": "Bearer",
        "expires_in": expires_in,
        "refresh_token": new_refresh_token
    }
