# Input Validation

## Purpose

Validate untrusted input at the authoritative boundary.

## Procedure

1. Identify untrusted fields.
2. Define type/range/format constraints.
3. Reject malformed or ambiguous inputs.
4. Normalize only deliberately.
5. Test invalid and boundary values.

## Guardrails

- Validation is not authorization.

## Output

Return:
- result
- evidence
- risks
- required follow-up
