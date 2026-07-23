---
layout: ../../layouts/GuideLayout.astro
title: "Understanding YAML Frontmatter for LLMs"
description: "Master metadata structures so agent orchestration frameworks can parse your skills."
---

YAML frontmatter is the standard way to attach metadata to a markdown file.

## Why Agents Need It
An agent parses the YAML to register the skill as a callable function or tool. If the YAML is malformed, the parser will crash, and your skill won't load.

## Best Practices
1.  Always enclose frontmatter between triple dashes `---`.
2.  Use standard keys: `name`, `description`, `version`.
3.  Ensure your description string is properly quoted if it contains colons or special characters.
