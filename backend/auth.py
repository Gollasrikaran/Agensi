import os
import jwt
import logging
import requests as http_requests
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from dotenv import load_dotenv

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
_jwks_cache: list = []

def _load_jwks():
    """Fetch the JWKS from Supabase Auth and cache the public keys."""
    global _jwks_cache
    if _jwks_cache:
        return _jwks_cache
    try:
        jwks_url = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"
        resp = http_requests.get(jwks_url, timeout=10)
        resp.raise_for_status()
        _jwks_cache = resp.json().get("keys", [])
        logger.info("JWKS loaded: %d key(s)", len(_jwks_cache))
    except Exception as e:
        logger.error("Failed to load JWKS: %s", e)
        _jwks_cache = []
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

    if alg.startswith("HS"):
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
            algorithms=[alg],
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
    FastAPI dependency — verifies the Supabase JWT locally (no network call).
    """
    token = credentials.credentials
    try:
        payload = _verify_jwt_local(token)
        if not payload.get("sub"):
            raise ValueError("JWT has no sub claim")
        return _UserProxy(payload)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired. Please log in again.")
    except jwt.InvalidAudienceError:
        raise HTTPException(status_code=401, detail="Invalid token audience.")
    except Exception as e:
        logger.error("JWT verification failed: %s | token prefix: %s", str(e), token[:20])
        raise HTTPException(status_code=401, detail=f"Auth error: {str(e)}")
