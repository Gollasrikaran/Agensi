import asyncio
from httpx import ASGITransport
import httpx
from backend.main import app

class TraceMiddleware:
    def __init__(self, app):
        self.app = app
    async def __call__(self, scope, receive, send):
        print(f"TRACE IN: path={scope.get('path')} root_path={scope.get('root_path')}")
        async def mock_send(message):
            print(f"TRACE OUT: {message.get('type')} {message.get('status')}")
            await send(message)
        return await self.app(scope, receive, mock_send)

# Intercept right before FastMCPWrapper calls self.app
for route in app.routes:
    if route.path == "/mcp":
        # route is a Mount. route.app is FastMCPWrapper
        wrapper = route.app
        original_app = wrapper.app
        wrapper.app = TraceMiddleware(original_app)

async def test():
    async with httpx.AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        # We need to bypass AgentAuthMiddleware which returns 401 if token is dummy
        # Or just use a dummy token but mock supabase in main.py
        pass

import backend.main
class MockSupabase:
    def table(self, *args, **kwargs): return self
    def select(self, *args, **kwargs): return self
    def eq(self, *args, **kwargs): return self
    def execute(self, *args, **kwargs):
        class Res:
            data = [{"user_id": "test_user"}]
        return Res()
backend.main.supabase = MockSupabase()

async def test_run():
    async with httpx.AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        res = await client.get("/mcp/dummy/sse")
        print("Status:", res.status_code)

asyncio.run(test_run())
