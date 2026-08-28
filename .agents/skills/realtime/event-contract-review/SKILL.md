# Event Contract Review

## Purpose

Review event schema and compatibility.

## Procedure

1. Inspect producers/consumers.
2. Define required/optional fields.
3. Consider versioning.
4. Check sensitive payloads.
5. Test unknown/duplicate/out-of-order events.

## Guardrails

- Do not silently repurpose existing event fields.

## Output

Return:
- result
- evidence
- risks
- required follow-up
