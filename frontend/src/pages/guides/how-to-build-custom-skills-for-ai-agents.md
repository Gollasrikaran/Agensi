---
layout: ../../layouts/GuideLayout.astro
title: "How to Build Custom Skills for AI Agents"
description: "A step-by-step tutorial on drafting actionable, model-agnostic instructions for autonomous agents."
---

Building custom skills for AI agents requires a shift in mindset. You are not "chatting" with an AI; you are programming its behavioral constraints and workflows.

## Step 1: Define the Trigger Condition
The most critical part of an agent skill is the **description**. This is how the orchestration layer (like LangChain or an MCP server) decides when to inject your skill into the context window.
Always use intent-matchable language:
> *Good:* "Use this skill when the user requests a code review for a Python file."
> *Bad:* "The best Python code reviewer on the market for only 5 credits!"

## Step 2: Establish the Workflow
Agents work best when given step-by-step logic.
1.  **Analyze:** What information does the agent need first?
2.  **Act:** What tool or operation should it perform?
3.  **Synthesize:** How should it format the final output to the user?

## Step 3: Remove the Fluff
AI agents have limited context windows. Every word in your skill costs tokens. Strip out politeness, marketing, and unnecessary adjectives. Use imperative verbs (e.g., "Extract the JSON," "Compile the list").
