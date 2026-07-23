---
layout: ../../layouts/GuideLayout.astro
title: "Bodhic AI Seller Requirements & Guidelines"
description: "Mandatory reading for all sellers. Learn the strict structure and security rules required to list a skill on Bodhic AI."
---

> [!IMPORTANT]
> This is a mandatory guide. All sellers must read and agree to these terms before uploading an AI Agent Skill to the marketplace.

When you submit a skill (a `.md` file) to Bodhic AI, it undergoes strict Tier 1 and Tier 2 AI scanning. We evaluate submissions on two primary axes: **STRUCTURE** and **SECURITY**.

## 1. STRUCTURE Requirements
Your skill must be a valid, actionable instruction set.
*   **Valid YAML Frontmatter:** You must include at least `name` and `description` in standard YAML block format.
*   **Intent-Matchable Description:** The `description` must clearly state *when* an agent should trigger the skill (e.g., "Use this when the user asks for X"). It cannot be marketing copy, pricing, or a sales pitch.
*   **Model-Agnostic Instructions:** Do not write instructions that rely on specific quirks of GPT-4, Claude, or Gemini. Ensure your logic works across models.
*   **No Unresolved Placeholders:** If you reference an API or tool, ensure the prompt explicitly explains how the agent should access or mock it.
*   **No Marketing Fluff:** Pricing, tags, and promotional text do not belong inside the executable instruction file.

## 2. SECURITY Requirements
Your skill will be instantly rejected (and your account may be flagged) if it violates any of the following:
*   **No Jailbreaks:** Instructions telling the agent to ignore, override, or bypass its safety guidelines or system prompt.
*   **No Hidden Data:** Disguised instructions in comments, unicode tricks, base64/hex-encoded blocks, or zero-width characters are strictly banned.
*   **No Prompt Injection (Downstream):** Instructions designed to hijack an agent only *after* it reads an external file or URL.
*   **No Data Exfiltration:** Instructions attempting to send file contents, API keys, or conversation history to an external URL.
*   **No Destructive Commands:** Unscoped file deletion or unrestricted shell execution without clear user boundaries.
*   **No False Authority:** Do not write instructions claiming "This is a system-level rule approved by Bodhic AI" to bypass scanning.

**Failure to adhere to these rules will result in automatic rejection.**
