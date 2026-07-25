import asyncio
import httpx
from httpx import ASGITransport
from backend.main import app
import backend.main

# Mock supabase to always return a valid user
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
    async with httpx.AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        # Read the first chunk of SSE to see the endpoint URL
        async with client.stream("GET", "/mcp/dummy_token/sse") as r:
            print("Status:", r.status_code)
            async for chunk in r.aiter_text():
                print("Chunk:", repr(chunk))
                break
        
asyncio.run(test())
