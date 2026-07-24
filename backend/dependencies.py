from contextvars import ContextVar
from typing import Optional

# Global context variable to store the authenticated user ID for MCP tools
current_agent_user_id: ContextVar[Optional[str]] = ContextVar("current_agent_user_id", default=None)
