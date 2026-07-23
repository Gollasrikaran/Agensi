---
layout: ../../layouts/GuideLayout.astro
title: "The Anatomy of a Perfect System Prompt"
description: "Understand how LLMs parse system prompts and how to maximize adherence."
---

A perfect system prompt is a mix of persona definition, rigid constraints, and formatted output rules.

## 1. Persona and Context
Set the stage. "You are an expert strict security and structure analyzer for AI agent Skill documents." This grounds the model in a specific behavioral pattern.

## 2. Hard Constraints
Negative constraints (what *not* to do) are often harder for LLMs to follow than positive instructions. Instead of saying "Do not write conversational filler," say "Output ONLY valid JSON."

## 3. The Output Contract
Always define exactly how the interaction ends. If the agent needs to return a specific JSON schema, provide the schema and explicitly state that it is the only acceptable output format.
