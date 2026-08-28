# Handoffs

## Product → Architecture

Include:
- problem statement
- target user
- acceptance criteria
- permissions/roles
- edge cases
- compatibility constraints

## Architecture → Engineering

Include:
- affected modules
- API/data model changes
- invariants
- migration strategy
- failure behavior
- rollout constraints

## Engineering → QA

Include:
- behavior changed
- test seams
- known edge cases
- migrations/config changes
- commands already run

## Engineering → Security

Include:
- trust-boundary changes
- authentication/authorization changes
- data sensitivity
- new external inputs
- new secrets or integrations

## Review → Tech Lead

Include:
- blocking findings
- non-blocking findings
- unresolved tradeoffs
- validation evidence
