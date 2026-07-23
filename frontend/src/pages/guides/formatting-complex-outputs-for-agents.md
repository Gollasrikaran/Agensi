---
layout: ../../../layouts/GuideLayout.astro
title: "Formatting Complex Outputs for Agents"
description: "Force agents to return strict, parseable JSON and Markdown without conversational filler."
---

One of the hardest parts of prompt engineering is getting the AI to shut up.

## The "No Yapping" Rule
If your skill is meant to be parsed programmatically, you must explicitly forbid conversational filler.
> "Do not include any conversational text. Do not say 'Here is the JSON'. Output ONLY the raw JSON block."

## Using `<format>` Tags
Wrap your expected output structure in XML tags so the agent has a visual boundary of what the final response should look like.
