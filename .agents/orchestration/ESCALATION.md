# Escalation Rules

Escalate when:

## Product
- requirements materially conflict
- acceptance criteria are missing for high-risk work
- behavior cannot be inferred safely

## Architecture
- a new subsystem is introduced
- public API compatibility breaks
- cross-service boundaries change
- major dependency or persistence technology is proposed

## Security
- auth/authz behavior changes
- sensitive information exposure is possible
- secrets or cryptographic material are involved

## Data
- destructive migration is required
- backfill/rewrite affects large datasets
- rollback is non-trivial

## Infrastructure
- production rollout/rollback changes
- availability may be degraded
- credentials, DNS, networking, or external environments change

## Human
- irreversible production action
- billing/payment action
- destructive data action
- secret rotation
- force push or branch protection bypass
