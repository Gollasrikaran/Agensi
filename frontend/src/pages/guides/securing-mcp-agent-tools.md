---
layout: ../../layouts/GuideLayout.astro
title: "Securing FastMCP Agent Tools & API Endpoints"
description: "A developer guide on securing Model Context Protocol (MCP) servers, preventing command injection, and implementing safe tool boundaries."
---

When creating advanced Level 4 and Level 5 AI agent skills that integrate with the Model Context Protocol (MCP), your sidecar tools execute code directly on buyer machines or remote cloud endpoints. Ensuring enterprise-grade security is mandatory for passing Bodhic AI moderation scans.

## 1. Preventing Command Injection in Tool Arguments

Never pass raw LLM-generated string arguments directly into system shells or terminal execution commands. Autonomous agents can be tricked via prompt injection into passing malicious payloads.

```python
# DANGEROUS (Vulnerable to Command Injection)
import os
def execute_ping(host: str):
    os.system(f"ping -c 4 {host}") # An attacker could pass "8.8.8.8 && rm -rf /"

# SECURE (Using Parameterized Subprocesses)
import subprocess
def execute_ping(host: str):
    # Pass arguments as a structured list without shell=True
    return subprocess.run(["ping", "-c", "4", host], capture_output=True, text=True, check=True)
```

## 2. Restricting Filesystem Access (Sandbox Guardrails)

If your MCP server reads or writes local files (such as automated refactoring agents), restrict operations to an explicit workspace directory. Prevent directory traversal attacks (`../../`) before accessing the filesystem.

```python
from pathlib import Path

def safe_read_file(workspace_root: str, relative_path: str) -> str:
    root = Path(workspace_root).resolve()
    target = (root / relative_path).resolve()
    
    # Ensure the resolved target is within the workspace boundary
    if not str(target).startswith(str(root)):
        raise PermissionError("Access denied: Attempted directory traversal outside workspace root.")
        
    return target.read_text(encoding="utf-8")
```

## 3. Implementing Rate Limiting & Timeout Controls

Long-running agent loops can get stuck in infinite retry cycles if an API or database query hangs. Set strict execution timeouts and retry limits on all MCP tool definitions.

```python
import asyncio
from fastmcp import FastMCP

mcp = FastMCP("SecureDatabaseInspector")

@mcp.tool()
async def query_slow_database(query_string: str) -> str:
    try:
        # Enforce a strict 5-second execution timeout
        return await asyncio.wait_for(execute_db_query(query_string), timeout=5.0)
    except asyncio.TimeoutError:
        return "Error: Query execution timed out after 5 seconds. Optimize your SQL query."
```

## 4. Handling API Keys and Secrets Safely

Never hardcode credentials or instruct agents to print raw API keys in conversational logs. Use environment variable references (`os.environ`) and redact sensitive Bearer tokens before emitting observation summaries back to the LLM context.
