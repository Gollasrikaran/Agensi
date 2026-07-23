---
layout: ../../../layouts/GuideLayout.astro
title: "How to Debug Agent Hallucinations"
description: "Techniques for grounding agents and reducing hallucinated API calls."
---

Hallucinations occur when an agent confidently executes a tool with made-up parameters, or returns fabricated facts.

## Grounding Techniques
1.  **Strict Typing:** If your skill requires JSON output, use a strict JSON schema and tell the agent to validate against it.
2.  **Provide Examples:** "Few-shot" prompting is the best way to prevent hallucinations. Provide 2-3 examples of correct tool usage inside your skill document.
3.  **Enforce Reflection:** Add a step in your workflow: "Before outputting the final answer, review the retrieved data and verify your conclusion matches the source text."
