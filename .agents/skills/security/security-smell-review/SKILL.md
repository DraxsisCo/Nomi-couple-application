# Security Smell Review

## Purpose

Quick scan for common security regressions in a diff.

## Procedure

1. Look for disabled checks.
2. Look for raw secret/token handling.
3. Look for unsafe interpolation.
4. Look for weakened CORS/auth/config.
5. Look for sensitive logs.

## Guardrails

- A smell is a lead, not proof.

## Output

Return:
- result
- evidence
- risks
- required follow-up
