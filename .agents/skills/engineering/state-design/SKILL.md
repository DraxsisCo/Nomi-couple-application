# State Design

## Purpose

Choose and implement appropriate client state ownership.

## Procedure

1. Classify server, local, derived, and shared state.
2. Reuse existing state/data libraries.
3. Minimize synchronization copies.
4. Define invalidation/update behavior.
5. Test critical transitions.

## Guardrails

- Do not introduce global state for local concerns.

## Output

Return:
- result
- evidence
- risks
- required follow-up
