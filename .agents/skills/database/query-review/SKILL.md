# Query Review

## Purpose

Review query correctness and performance.

## Procedure

1. Confirm semantics.
2. Inspect cardinality/access pattern.
3. Check indexes.
4. Avoid N+1 and unbounded scans.
5. Consider transaction/isolation.
6. Measure where possible.

## Guardrails

- Do not add indexes blindly.

## Output

Return:
- result
- evidence
- risks
- required follow-up
