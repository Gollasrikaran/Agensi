---
layout: ../../layouts/GuideLayout.astro
title: "Advanced Prompt Engineering: CoT, ReACT, and Self-Reflection"
description: "Master advanced agent reasoning frameworks including Chain of Thought, ReACT tool orchestration, and automated self-correction."
---

When developing high-complexity (Level 3 to Level 5) AI agent skills on BodhicAI, simple prompt instructions are no longer sufficient. You must design prompts that induce structured reasoning, tool orchestration, and error correction.

## 1. Chain of Thought (CoT) Reasoning

Chain of Thought prompting instructs the model to break down complex problems into intermediate reasoning steps before emitting a final answer. This reduces logical errors and calculation mistakes by up to 80%.

```markdown
## Reasoning Instructions
Before providing your final recommendation, you MUST conduct a structured analysis:
1. **Understand**: Restate the core problem and identify constraints.
2. **Deconstruct**: List all variables, edge cases, and potential risks.
3. **Evaluate Options**: Compare at least two alternative implementation strategies.
4. **Synthesize**: Present the optimal solution with technical justification.
```

## 2. ReACT (Reason + Act) Tool Orchestration

ReACT is the foundational paradigm for Model Context Protocol (MCP) agents. It forces the agent to alternate between reasoning about its current state and executing specific tools to gather missing data.

```markdown
## Execution Protocol (ReACT)
When solving a user task, adhere strictly to this loop:
- **Thought**: What information do I lack? What tool can provide this data?
- **Action**: Call the appropriate tool with validated parameters.
- **Observation**: Analyze the raw tool output.
- **Reflection**: Did the action succeed? If not, adjust parameters and retry. Do not guess or extrapolate tool outputs.
```

## 3. Automated Self-Reflection & Critique

Instructing an agent to critique its own generated output before presenting it to the user catches syntax errors, security flaws, and requirement omissions.

```markdown
## Verification & Quality Assurance
Upon completing your initial draft solution, perform an internal review against these criteria:
- [ ] Does the code compile without type errors or missing imports?
- [ ] Are all security best practices (input validation, SQL injection prevention) applied?
- [ ] Does the response directly address all requirements in the user's initial prompt?

If any check fails, regenerate the solution before responding.
```

## 4. Managing Context Windows in Long Workflows

In extended agent loops, context bloat can degrade reasoning performance. Include explicit instructions for state summarization and context pruning.

```markdown
## Memory & State Management
- When analyzing large codebases, summarize file contents rather than repeating full source code.
- Keep track of completed milestones in a concise bulleted TODO list.
- Discard intermediate debugging logs once the root cause is confirmed.
```
