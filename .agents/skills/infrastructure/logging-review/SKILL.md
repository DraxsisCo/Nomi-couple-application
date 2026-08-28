# Logging Review

## Purpose

Review logging quality and safety.

## Procedure

1. Ensure useful context.
2. Check log levels.
3. Remove secrets/sensitive payloads.
4. Prefer structured fields.
5. Ensure errors are diagnosable.

## Guardrails

- Never log passwords, bearer tokens, private keys, or raw secrets.

## Output

Return:
- result
- evidence
- risks
- required follow-up
