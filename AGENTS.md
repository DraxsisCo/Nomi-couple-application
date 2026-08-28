# AGENTS.md — Startup Agent Operating System

## Purpose

This repository uses a governed multi-agent operating model.

The root agent must behave as an orchestrator first and an implementer second.
Do not involve every specialist in every task. Route work by domain, risk, and
required independence.

## Operating Order

For any non-trivial task:

1. Parse the request into a task envelope.
2. Classify task type, domains, and risk.
3. Read only the relevant repository context.
4. Select the minimum agent set required.
5. Choose the matching workflow.
6. Produce a plan when the workflow requires one.
7. Implement with clearly assigned ownership.
8. Run independent review gates.
9. Validate using real repository commands.
10. Report what actually happened.

## Context Loading

Do not read the entire `.agents/` or `docs/` tree.

Start with:

1. this `AGENTS.md`
2. `.agents/REGISTRY.md`
3. `.agents/orchestration/ROUTING.md`
4. the selected workflow
5. relevant scoped `AGENTS.md`
6. only agent/skill files required for the task
7. relevant product/architecture documentation

## Global Rules

- Search before creating.
- Reuse before abstracting.
- Prefer the smallest coherent change.
- Do not make unrelated refactors.
- Do not invent commands, schemas, APIs, environment variables, or conventions.
- Never claim validation succeeded unless the command actually ran successfully.
- Never weaken security or tests merely to make a task pass.
- Implementers cannot be the sole approvers of their own work.
- Destructive, production, billing, credential, and access-control actions may require human approval.
- Never expose secrets in output, logs, commits, fixtures, or examples.
- Treat repository history and documentation as evidence, not unquestionable truth.
- If requirements conflict materially, surface the conflict.

## Risk Levels

### LOW
Local, reversible change with limited blast radius.

Default:
- implementer
- independent reviewer

### MEDIUM
Normal product feature or defect across one or more application layers.

Default:
- planner/owner when needed
- implementer(s)
- test engineer
- independent reviewer

### HIGH
Authentication, authorization, migrations, sensitive data, infrastructure,
public API compatibility, concurrency, payments, or broad architectural changes.

Default:
- architect
- relevant engineer(s)
- QA
- security or infrastructure specialist
- independent reviewer
- tech lead

### CRITICAL
Potential production outage, destructive data action, credential incident,
security breach, large migration, or irreversible external action.

Default:
- orchestrator
- architect
- security/SRE
- implementer
- independent QA
- independent reviewer
- tech lead
- human approval before irreversible execution

## Human Approval Required

Unless the user explicitly authorizes it, do not perform:

- production deployment
- production database migration
- destructive production data operations
- secret/key rotation
- infrastructure deletion
- billing or payment configuration changes
- force push
- branch protection bypass
- security-gate bypass
- irreversible external account actions

Preparation, analysis, code changes, migration files, runbooks, and PRs may be
created without executing the irreversible action.

## Definition of Done

A task is complete only when applicable:

- acceptance criteria are satisfied
- architecture boundaries are preserved
- authorization and validation are correct
- tests are added or updated
- relevant validation commands pass
- security implications are reviewed
- documentation is updated
- no unrelated changes remain
- the final diff is inspected

## Final Report

Use:

### Completed
What changed.

### Validation
Commands actually executed and their results.

### Files Changed
Important files.

### Risks / Notes
Assumptions, migrations, compatibility, unresolved concerns, or required human actions.
