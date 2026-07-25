import asyncio
import httpx
from httpx import ASGITransport
import backend.main
from backend.main import app
import json

class MockSupabase:
    def table(self, *args, **kwargs): return self
    def select(self, *args, **kwargs): return self
    def eq(self, *args, **kwargs): return self
    def execute(self, *args, **kwargs):
        class Res:
            data = [{"user_id": "test_user"}]
        return Res()

backend.main.supabase = MockSupabase()

async def test():
    async with ASGITransport(app=app) as transport:
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            res = await client.get("/mcp/bodhic_dummy/sse", follow_redirects=False)
            print("Status:", res.status_code)
        
asyncio.run(test())
