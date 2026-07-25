import asyncio
import httpx
from httpx import ASGITransport
from backend.main import app

async def test():
    async with httpx.AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        response = await client.get("/mcp/dummy_token/sse")
        print("Status:", response.status_code)
        print("Headers:", response.headers)
        print("Body:", response.text)
        
asyncio.run(test())
