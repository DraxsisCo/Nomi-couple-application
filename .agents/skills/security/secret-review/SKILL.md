# Secret Review

## Purpose

Inspect code/config changes for secret handling.

## Procedure

1. Identify credentials and secret sources.
2. Check repo history exposure risk.
3. Verify environment/secret-store injection.
4. Check logs/errors.
5. Confirm rotation guidance if exposed.

## Guardrails

- Never reproduce real secrets in reports or examples.

## Output

Return:
- result
- evidence
- risks
- required follow-up
