import asyncio
import httpx
import json
import os

API_KEY = os.environ.get('BODHIC_TEST_API_KEY', 'your-test-api-key-here')

async def test():
    base_url = "https://bodhicai.onrender.com"
    sse_url = f"{base_url}/mcp/{API_KEY}/sse"
    
    async with httpx.AsyncClient() as client:
        # Step 1: Connect to SSE and get endpoint
        print(f"Connecting to {sse_url}")
        async with client.stream("GET", sse_url) as res:
            print("SSE Status:", res.status_code)
            if res.status_code != 200:
                print(await res.aread())
                return
                
            endpoint = None
            async for line in res.aiter_lines():
                if line.startswith("data: "):
                    endpoint = line[6:].strip()
                    break
                    
        if not endpoint:
            print("Did not receive endpoint from SSE")
            return
            
        print("Received endpoint:", endpoint)
        
        # Determine full post URL
        if endpoint.startswith("http"):
            post_url = endpoint
        else:
            post_url = f"{base_url}{endpoint}"
            
        print(f"POSTing to {post_url}")
        
        # Step 2: Send initialize request
        init_req = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": {"name": "test-client", "version": "1.0"}
            }
        }
        
        # Important: must not close the SSE connection in real MCP, but for a quick test, 
        # FastMCP might allow POSTs while the session is technically open (or it closes when stream exits?)
        # Actually FastMCP cleans up the session if SSE drops. 
        # So we MUST keep SSE open!
        
async def test_proper():
    base_url = "https://bodhicai.onrender.com"
    sse_url = f"{base_url}/mcp/{API_KEY}/sse"
    
    async with httpx.AsyncClient() as client:
        async with client.stream("GET", sse_url) as res:
            endpoint = None
            async for line in res.aiter_lines():
                if line.startswith("data: "):
                    endpoint = line[6:].strip()
                    break
                    
            if not endpoint:
                print("No endpoint")
                return
                
            post_url = endpoint if endpoint.startswith("http") else f"{base_url}{endpoint}"
            print("POST URL:", post_url)
            
            init_req = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "initialize",
                "params": {
                    "protocolVersion": "2024-11-05",
                    "capabilities": {},
                    "clientInfo": {"name": "test-client", "version": "1.0"}
                }
            }
            post_res = await client.post(post_url, json=init_req)
            print("Init Response Status:", post_res.status_code)
            print("Init Response Body:", post_res.text)

asyncio.run(test_proper())
