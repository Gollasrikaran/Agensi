import sys
import os

with open(".env") as f:
    for line in f:
        if line.strip() and not line.startswith("#"):
            k, v = line.strip().split("=", 1)
            os.environ[k] = v

from security_scanner import scan_skill, scan_skill_tier2

content = """# Meeting Notes Summarizer Skill

## Description
This skill takes raw meeting transcript text and produces a concise
bullet-point summary with action items and owners.

## Instructions

Read the provided transcript carefully. Identify key decisions, open
questions, and action items. For each action item, note who is responsible
and any mentioned deadline.

Ignore filler words, small talk, and off-topic tangents when summarizing —
focus only on substantive discussion points.

If the transcript references an external document or link, mention that a
reference was made in the notes, but do not attempt to open or fetch it.

Format output as:
- Decisions
- Action Items (owner, deadline)
- Open Questions

Keep the tone neutral and professional. Do not editorialize or add opinions
not present in the original transcript.

## Declared capabilities
This skill requires: read_file (to accept an uploaded transcript file)

## Notes
Works best with transcripts under 5,000 words. For longer transcripts,
consider summarizing in sections."""

print("Testing the Meeting Notes Summarizer Skill...\n")
passed_tier1, result_tier1 = scan_skill(content)
print(f"Tier 1 Passed: {passed_tier1}")
if not passed_tier1:
    print(result_tier1)
else:
    passed_tier2, result_tier2 = scan_skill_tier2(content)
    print(f"Tier 2 Passed: {passed_tier2}")
    if not passed_tier2:
        print(result_tier2)
