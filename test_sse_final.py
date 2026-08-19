import asyncio
import httpx
from httpx import ASGITransport
import backend.main
from backend.main import app
import json
import os

API_KEY = os.environ.get('BODHIC_TEST_API_KEY', 'your-test-api-key-here')

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
            async with client.stream("GET", f"/mcp/{API_KEY}/sse") as res:
                print("Status:", res.status_code)
                print("Headers:", res.headers)
                async for chunk in res.aiter_text():
                    print("Chunk:", repr(chunk))
                    break
        
asyncio.run(test())
