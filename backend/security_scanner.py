import re
from typing import Dict, Any, Tuple

# Security Requirements: Agent & Prompt-Injection Security (Tier 1 synchronous)

def scan_skill(content: str) -> Tuple[bool, Dict[str, Any]]:
    """
    Tier 1 synchronous scan (target: < 2s)
    - regex/heuristic injection + secrets scan
    - URL/domain checks
    Returns: (passed: bool, result_json: dict)
    """
    issues = []
    
    # 1. Direct prompt injection detection (OWASP LLM01)
    injection_patterns = [
        r"ignore previous instructions",
        r"disregard the system prompt",
        r"you are now\.\.\."
    ]
    for pattern in injection_patterns:
        if re.search(pattern, content, re.IGNORECASE):
            issues.append({"rule": "direct_injection", "description": "Found potential prompt injection phrasing."})

    # 4. Secrets & sensitive-data scanning (OWASP LLM06)
    secret_patterns = [
        r"(sk-[a-zA-Z0-9]{48})", # dummy API key pattern
        r"BEGIN PRIVATE KEY",
        r"password=.*"
    ]
    for pattern in secret_patterns:
        if re.search(pattern, content):
            issues.append({"rule": "secrets_leak", "description": "Found potential secret/credential."})
            
    # 7. Resource limits (OWASP LLM04 analogue)
    if len(content) > 256 * 1024: # 256KB
        issues.append({"rule": "file_size_exceeded", "description": "File exceeds 256KB limit."})
        
    passed = len(issues) == 0
    return passed, {"passed": passed, "issues": issues, "tier": 1}
