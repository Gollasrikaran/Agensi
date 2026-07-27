---
layout: ../../layouts/GuideLayout.astro
title: "How to Write Effective Prompts for AI Agents"
description: "A comprehensive masterclass on structuring system prompts, setting constraints, and ensuring high adherence across LLMs."
---

Writing effective prompts for AI agents requires a transition from conversational instruction to structural software engineering. When building reusable agent skills on BodhicAI, your prompt acts as the execution logic for an autonomous system.

## 1. Define a Clear Role and Objective

An agent needs an unambiguous identity and purpose. Avoid generic instructions like "Be helpful." Instead, establish a precise domain persona and operational scope.

```markdown
# BAD
You are a helpful coding assistant. Fix bugs in my code.

# GOOD
You are a Senior Principal Systems Architect specializing in Rust and distributed systems. 
Your primary objective is to analyze code snippets for concurrency deadlocks, memory leaks, and race conditions, proposing zero-cost abstraction solutions.
```

## 2. Structure Instructions with Clear Hierarchy

Use clean Markdown hierarchy (H1, H2, H3) and numbered step-by-step workflows. Autonomous agents parse organized markdown structures significantly better than dense paragraphs.

### Recommended Structure:
1. **Context & Scope**: What the agent is handling and why.
2. **Step-by-Step Execution Plan**: Sequential actions required to fulfill the goal.
3. **Operational Constraints**: Explicit boundaries (what NOT to do).
4. **Output Specification**: Exact schema or format required.

## 3. Implement Strict Operational Constraints

Constraints prevent hallucinations, scope creep, and prompt injection vulnerabilities. State negative constraints clearly and decisively.

```markdown
## Constraints & Boundaries
- NEVER execute destructive terminal commands without explicit user confirmation.
- DO NOT invent API parameters or library functions not present in the provided context.
- If a user request is ambiguous, ASK a clarifying question rather than guessing.
- Keep responses concise; omit introductory fluff such as "Sure, I can help with that."
```

## 4. Leverage Few-Shot Examples

Providing 1 to 3 concrete input-output examples dramatically improves adherence, especially for complex JSON schemas or specialized tone requirements.

```markdown
## Examples

### Example 1: High-Severity Bug
**Input**: Thread A locks Resource 1 then waits for Resource 2. Thread B locks Resource 2 then waits for Resource 1.
**Output**: 
{
  "status": "CRITICAL_DEADLOCK",
  "explanation": "Circular wait condition detected between Thread A and Thread B.",
  "remediation": "Acquire mutex locks in a globally consistent order across all threads."
}
```

## 5. Test Across Multiple Architectures

Ensure your prompt performs reliably across different foundational LLM architectures (GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro). Use BodhicAI's built-in testing chat to verify adherence before publishing your skill to the marketplace.
