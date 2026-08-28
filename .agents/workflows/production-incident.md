# Production Incident Workflow

## Route
SRE → Relevant Engineer → Security/Data/DevOps as triggered → Tech Lead

## Priorities
1. User/system safety
2. Stabilization
3. Evidence preservation
4. Scope understanding
5. Recovery
6. Root-cause follow-up

## Steps
- establish symptoms and blast radius
- identify recent relevant changes
- choose reversible mitigation first
- verify recovery using user-facing and operational signals
- document timeline and facts
- create follow-up fixes and postmortem
- require human approval for destructive/irreversible actions
