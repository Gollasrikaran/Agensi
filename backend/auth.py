import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import jwt
import logging
import requests as http_requests
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))
load_dotenv()

logger = logging.getLogger(__name__)

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

if not SUPABASE_URL or not SUPABASE_KEY:
    logger.warning("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing from environment.")

# Initialize the Supabase client for backend operations (DB, storage, etc.)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

security = HTTPBearer()

# ---------------------------------------------------------------------------
# Local JWT verification using Supabase JWKS — no network call per request.
# Fetched once at startup and cached in memory.
# ---------------------------------------------------------------------------
import time
_jwks_cache: list = []
_jwks_cache_time: float = 0
_JWKS_TTL = 3600  # Refresh every hour

def _load_jwks():
    """Fetch the JWKS from Supabase Auth and cache the public keys."""
    global _jwks_cache, _jwks_cache_time
    if _jwks_cache and (time.time() - _jwks_cache_time) < _JWKS_TTL:
        return _jwks_cache
    try:
        jwks_url = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"
        resp = http_requests.get(jwks_url, timeout=10)
        resp.raise_for_status()
        _jwks_cache = resp.json().get("keys", [])
        _jwks_cache_time = time.time()
        logger.info("JWKS loaded: %d key(s)", len(_jwks_cache))
    except Exception as e:
        logger.error("Failed to load JWKS: %s", e)
    return _jwks_cache


def _verify_jwt_local(token: str) -> dict:
    """
    Verify a Supabase JWT locally using cached JWKS public keys.
    Works for both ES256 and HS256 tokens.
    Returns the decoded payload on success, raises on failure.
    """
    # Decode the header to find the key id (kid) and algorithm
    try:
        header = jwt.get_unverified_header(token)
    except Exception as e:
        raise ValueError(f"Invalid JWT header: {e}")

    alg = header.get("alg", "HS256")
    kid = header.get("kid")

    # SECURITY: Only allow known algorithms
    ALLOWED_ALGORITHMS = {"HS256", "ES256"}
    if alg not in ALLOWED_ALGORITHMS:
        raise ValueError(f"Unsupported JWT algorithm: {alg}")

    if alg == "HS256":
        # Legacy HS256 — verify using the JWT secret
        jwt_secret = os.getenv("SUPABASE_JWT_SECRET", "")
        if not jwt_secret:
            raise ValueError("SUPABASE_JWT_SECRET env var not set for HS256 token verification")
        payload = jwt.decode(
            token,
            jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
            options={"verify_exp": True},
        )
    else:
        # Asymmetric (ES256 etc.) — verify using JWKS public key
        keys = _load_jwks()
        if not keys:
            raise ValueError("JWKS not loaded — cannot verify token")

        # Find the matching key by kid, or use the first key if no kid
        jwk = next((k for k in keys if k.get("kid") == kid), keys[0] if keys else None)
        if not jwk:
            raise ValueError(f"No matching JWK found for kid={kid}")

        public_key = jwt.algorithms.ECAlgorithm.from_jwk(jwk)
        payload = jwt.decode(
            token,
            public_key,
            algorithms=["ES256"],
            audience="authenticated",
            options={"verify_exp": True},
        )

    return payload


class _UserProxy:
    """Lightweight stand-in for the Supabase user object, built from JWT payload."""
    def __init__(self, payload: dict):
        self.id = payload.get("sub")
        self.email = payload.get("email")
        self.user_metadata = payload.get("user_metadata", {})
        self.app_metadata = payload.get("app_metadata", {})
        self.role = payload.get("role", "authenticated")


async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    """
    FastAPI dependency — verifies the Supabase JWT locally (no network call),
    with automatic fallback to Supabase Auth API if local verification fails.
    """
    token = credentials.credentials
    try:
        payload = _verify_jwt_local(token)
        if not payload.get("sub"):
            raise ValueError("JWT has no sub claim")
            
        # Check email verification
        email_confirmed = payload.get("email_confirmed_at") or payload.get("confirmed_at")
        if not email_confirmed:
            raise HTTPException(status_code=403, detail="Please verify your email address before continuing.")
            
        return _UserProxy(payload)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired. Please log in again.")
    except Exception as local_err:
        logger.warning("Local JWT verification failed (%s), falling back to supabase.auth.get_user...", str(local_err))
        try:
            response = supabase.auth.get_user(token)
            if not response.user:
                raise HTTPException(status_code=401, detail="Invalid or expired session. Please log in again.")
            return response.user
        except HTTPException:
            raise
        except Exception as e:
            logger.error("JWT verification and fallback failed: %s", str(e))
            raise HTTPException(status_code=401, detail=f"Auth error: {str(e)}")
