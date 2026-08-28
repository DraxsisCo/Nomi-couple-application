# Startup Agent OS

This directory defines a repository-native orchestration system for Codex and
other coding agents.

It separates six concerns:

- **Agents** — who reasons about the task
- **Skills** — reusable procedures
- **Workflows** — sequence and gates
- **Standards** — non-negotiable repository rules
- **Knowledge** — product/architecture truth in `/docs`
- **Memory** — durable decisions, discoveries, incidents, and lessons

The orchestrator should load the smallest useful slice of this system instead
of reading all files.

## Recommended Runtime Pattern

Request
→ Task envelope
→ Risk/domain classification
→ Workflow selection
→ Agent selection
→ Skill loading
→ Implementation
→ Independent review gates
→ Validation
→ Final report
