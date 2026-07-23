---
layout: ../../../layouts/GuideLayout.astro
title: "Best Practices for Structuring AI Agent Instructions"
description: "Separate marketing fluff from executable instructions for maximum reliability."
---

When writing a skill for the Bodhic AI marketplace, structure is everything. An unstructured prompt leads to unpredictable agent behavior.

## The YAML Frontmatter
Every skill must begin with valid YAML.
```yaml
---
name: DatabaseSchemaAnalyzer
description: Trigger this skill when the user asks to analyze, visualize, or modify a SQL database schema.
---
```

## The Instruction Body
Use markdown heavily to create boundaries for the LLM.
1.  Use `## Rules` for unbreakable constraints.
2.  Use `## Workflow` for the step-by-step process.
3.  Use `<example>` tags to demonstrate expected inputs and outputs.

By cleanly separating the sections, you prevent the model's attention from drifting during long workflows.
