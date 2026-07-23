---
layout: ../../../layouts/GuideLayout.astro
title: "Model-Agnostic Prompt Engineering"
description: "Write instructions that work flawlessly across GPT-4, Claude 3.5, and Gemini."
---

Because buyers on Bodhic AI might run your skills using different foundational models, your prompts must be robust.

## Avoid Model-Specific Quirks
*   Don't rely on Claude's XML tag affinity if GPT-4 prefers Markdown headers. Use a mix of both if necessary, but keep it standard.
*   Don't assume the model has a massive 2M token context window like Gemini 1.5 Pro. Keep instructions concise so they fit in smaller models.
*   Avoid referencing the model's internal safety filters, as they vary wildly between OpenAI, Anthropic, and Google.
