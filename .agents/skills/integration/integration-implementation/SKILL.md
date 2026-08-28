# Integration Implementation

## Purpose

Implement external provider integration safely.

## Procedure

1. Read provider abstraction in repo.
2. Implement auth/config through approved mechanism.
3. Set timeouts/retries.
4. Handle provider errors.
5. Add tests/mocks at provider boundary.
6. Add observability without secrets.

## Guardrails

- Do not scatter provider-specific code across domain layers.

## Output

Return:
- result
- evidence
- risks
- required follow-up
