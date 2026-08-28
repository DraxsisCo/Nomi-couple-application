# Integration Design

## Purpose

Design a robust third-party integration.

## Procedure

1. Identify trust boundary and provider contract.
2. Define auth/secret handling.
3. Define idempotency/retry/timeouts.
4. Plan webhook verification if relevant.
5. Define degraded/failure mode.
6. Plan observability.

## Guardrails

- Assume providers fail and duplicate events occur.

## Output

Return:
- result
- evidence
- risks
- required follow-up
