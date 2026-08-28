# Quality Gates

## G0 — Scope
Pass when:
- objective is understood
- affected domain is known
- risk is classified

## G1 — Requirements
Pass when:
- acceptance criteria exist
- important edge cases are covered
- permissions and failure behavior are identified

## G2 — Architecture
Required for HIGH/CRITICAL and meaningful cross-boundary changes.

Pass when:
- ownership is clear
- data/API impact is defined
- migration/compatibility concerns are addressed

## G3 — Implementation
Pass when:
- requested behavior is implemented
- no unrelated changes are present
- implementation follows repository conventions

## G4 — Verification
Pass when:
- behavior tests exist where appropriate
- relevant checks ran successfully
- failures are understood and reported

## G5 — Security / Reliability
Required when triggered by routing rules.

Pass when:
- no blocking security/reliability concern remains
- rollout and rollback are acceptable where relevant

## G6 — Independent Review
Pass when:
- reviewer is not the sole implementer
- diff is inspected
- blocking review findings are resolved

## G7 — Human Approval
Required before irreversible actions listed in `/AGENTS.md`.
