---
layout: ../../layouts/GuideLayout.astro
title: "Keyword Research & Metadata Guide for Skill Creators"
description: "Master keyword research, semantic tagging, and YAML frontmatter optimization to maximize sales and agent discoverability."
---

When buyers or autonomous orchestration agents search the Bodhic AI marketplace, they rely on rich metadata and keyword indexing. This guide explains how to perform keyword research and configure YAML frontmatter for maximum visibility.

## 1. Understanding Buyer Search Intent

Keyword research for AI agent skills differs from traditional web SEO. You must target three distinct types of search intent:

| Intent Type | Buyer Mindset | Example Search Query | Optimal Keyword Tags |
| :--- | :--- | :--- | :--- |
| **Transactional** | Ready to purchase a specific solution | *"buy automated django security scanner"* | `django`, `security`, `scanner`, `owasp` |
| **Problem-Solving** | Debugging an urgent technical issue | *"fix cors error in spring boot api"* | `spring-boot`, `cors`, `api-debugging` |
| **Workflow Automation** | Looking to streamline daily engineering | *"automate github PR code reviews"* | `github-actions`, `code-review`, `ci-cd` |

## 2. Using Free Keyword Research Tools

To identify high-traffic keyword opportunities before creating your skill, utilize these strategies:
- **GitHub Trending & Issues**: Look at trending repositories and frequently opened issues in popular open-source projects.
- **Stack Overflow Tag Trends**: Identify tags with high question volume but low answer satisfaction rates.
- **Bodhic AI Search Auto-Complete**: Use the marketplace search bar to see what topics other buyers are actively looking for.

## 3. Optimizing YAML Frontmatter Metadata

When packaging your skill in Markdown or ZIP archives, your YAML frontmatter is parsed directly by Bodhic AI's ingestion engine. Ensure your fields are comprehensive and accurate.

```yaml
---
name: "enterprise-kubernetes-cluster-debugger"
title: "Enterprise Kubernetes Cluster Debugger & Pod Crashloop Analyzer"
version: "2.1.0"
category: "DevOps, Cloud, Kubernetes"
complexity_level: 4
keywords:
  - kubernetes
  - k8s
  - crashloopbackoff
  - kubectl
  - aws-eks
  - gcp-gke
  - pod-debugging
description: >
  An autonomous diagnostics agent that inspects Kubernetes cluster logs, identifies Pod crashloops, evaluates OOMKilled events, and generates actionable YAML remediation manifests.
---
```

## 4. Preventing Metadata Stuffing Penalties

Do not spam irrelevant keywords in your tags or description. Bodhic AI's moderation system and search indexing algorithm penalize keyword stuffing:
- **Rule 1**: Only include frameworks and tools that your skill explicitly supports and tests.
- **Rule 2**: Keep tag counts between 5 and 10 highly relevant terms.
- **Rule 3**: Ensure keyword phrases flow naturally within your descriptive paragraphs.
