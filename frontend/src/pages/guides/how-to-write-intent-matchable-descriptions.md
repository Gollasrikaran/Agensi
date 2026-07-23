---
layout: ../../../layouts/GuideLayout.astro
title: "Writing Intent-Matchable Descriptions"
description: "Make sure your skills get triggered correctly by writing precise trigger conditions."
---

In agentic frameworks, the system prompt doesn't load all skills at once. It uses semantic search or an LLM router to read the `description` of available skills and picks the right one.

## The Routing Problem
If your description is "This is a great skill for coding," the router won't know *when* to use it.

## The Solution
Write descriptions as **Trigger Conditions**:
*   "Use this tool when you need to fetch live stock prices."
*   "Trigger this skill if the user asks to translate text into French."
*   "Invoke when a database connection fails and you need debugging steps."
