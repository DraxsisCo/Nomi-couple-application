# Routing Rules

## Task Type → Default Workflow

- new feature → `feature-development.md`
- bug → `bug-fix.md`
- security finding → `security-fix.md`
- production incident → `production-incident.md`
- architecture change → `architecture-change.md`
- schema/data change → `database-migration.md`
- dependency change → `dependency-upgrade.md`
- release work → `release.md`
- product discovery → `product-discovery.md`
- startup experiment → `startup-experiment.md`

## Domain → Primary Agent

- requirements / acceptance criteria → product-manager
- backlog / delivery detail → product-owner
- product metrics → product-analyst
- UX evidence → ux-researcher
- architecture → solution-architect
- backend API / service → backend-engineer
- frontend UI / state → frontend-engineer
- schema / query / migration → database-engineer
- realtime / WebSocket → realtime-engineer
- third-party integration → integration-engineer
- tests → test-engineer
- broad QA → qa-lead
- security → security-engineer
- application security review → appsec-reviewer
- threat modeling → threat-modeler
- CI/CD → devops-engineer
- production reliability → sre-engineer
- telemetry → observability-engineer
- design system → design-lead
- UI craft → ui-designer
- UX flow → ux-designer
- accessibility → accessibility-reviewer
- unit economics → financial-analyst
- pricing → pricing-strategist
- competitive landscape → competitive-analyst
- growth experiments → growth-lead
- SEO → seo-specialist
- funnel / event analytics → analytics-specialist
- technical docs → technical-writer

## Mandatory Specialist Triggers

Add security-engineer when:
- authentication changes
- authorization changes
- secrets/keys/tokens are involved
- sensitive data handling changes
- encryption/signing changes
- external trust boundaries change

Add database-engineer when:
- schema changes
- constraints/indexes change
- data migration is required
- transaction semantics change

Add devops-engineer when:
- CI/CD changes
- container/runtime config changes
- deployment configuration changes
- secret injection mechanism changes

Add SRE when:
- production reliability or incident response is involved
- rollout/rollback strategy matters
- availability/SLO impact is significant

Add performance-engineer when:
- latency/throughput/regression is a stated requirement
- query or frontend performance is central to the task

Add accessibility-reviewer when:
- user-facing flows materially change
- keyboard/screen-reader semantics are likely affected

## Independent Review

The same agent must not be both:
- primary implementer and sole code reviewer
- migration author and sole production approver
- security change author and sole security approver
