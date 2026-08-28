# Idempotency Review

## Purpose

Ensure retries/duplicates do not cause unintended repeated effects.

## Procedure

1. Identify retriable operations.
2. Define idempotency key/source.
3. Define storage/window.
4. Test duplicate delivery.
5. Review failure after partial completion.

## Guardrails

- Assume networks retry at inconvenient moments.

## Output

Return:
- result
- evidence
- risks
- required follow-up
